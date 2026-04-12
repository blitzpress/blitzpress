import { hooks } from "../plugin-runtime/hooks";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
type HttpRequestBody = BodyInit | JsonValue | Record<string, unknown> | unknown[] | null | undefined;

interface HttpClientOptions {
  headers?: Headers;
  json?: boolean;
}

function cloneHeaders(headers?: Headers): Headers {
  return new Headers(headers);
}

function isFormData(value: HttpRequestBody): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

function isBodyInit(value: HttpRequestBody): value is BodyInit {
  return typeof value === "string"
    || value instanceof Blob
    || value instanceof URLSearchParams
    || value instanceof ArrayBuffer
    || ArrayBuffer.isView(value)
    || value instanceof ReadableStream
    || isFormData(value);
}

function isPlainJsonValue(value: HttpRequestBody): value is JsonValue | Record<string, unknown> | unknown[] {
  if (value === null || value === undefined) return false;
  if (isBodyInit(value)) return false;
  return typeof value === "object" || Array.isArray(value);
}

export class HttpClient {
  private readonly headers: Headers;
  private readonly json: boolean;

  constructor(options: HttpClientOptions = {}) {
    this.headers = cloneHeaders(options.headers);
    this.json = options.json ?? false;
  }

  private clone(next: Partial<HttpClientOptions> = {}): HttpClient {
    return new HttpClient({
      headers: next.headers ?? this.headers,
      json: next.json ?? this.json,
    });
  }

  withHeader(key: string, value: string): HttpClient {
    const headers = cloneHeaders(this.headers);
    headers.set(key, value);
    return this.clone({ headers });
  }

  withHeaders(headersInit: HeadersInit): HttpClient {
    const headers = cloneHeaders(this.headers);
    for (const [key, value] of new Headers(headersInit).entries()) {
      headers.set(key, value);
    }
    return this.clone({ headers });
  }

  withBearerToken(token: string): HttpClient {
    return this.withHeader("Authorization", `Bearer ${token}`);
  }

  asJson(): HttpClient {
    const headers = cloneHeaders(this.headers);
    headers.set("Accept", "application/json");
    return this.clone({ headers, json: true });
  }

  send(url: string, init: RequestInit = {}): Promise<Response> {
    const { body, method = "GET", ...rest } = init;
    return this.request(method, url, body as HttpRequestBody, rest);
  }

  get(url: string, init: RequestInit = {}): Promise<Response> {
    return this.request("GET", url, undefined, init);
  }

  post(url: string, body?: HttpRequestBody, init: RequestInit = {}): Promise<Response> {
    return this.request("POST", url, body, init);
  }

  put(url: string, body?: HttpRequestBody, init: RequestInit = {}): Promise<Response> {
    return this.request("PUT", url, body, init);
  }

  patch(url: string, body?: HttpRequestBody, init: RequestInit = {}): Promise<Response> {
    return this.request("PATCH", url, body, init);
  }

  delete(url: string, body?: HttpRequestBody, init: RequestInit = {}): Promise<Response> {
    return this.request("DELETE", url, body, init);
  }

  private request(method: string, url: string, body?: HttpRequestBody, init: RequestInit = {}): Promise<Response> {
    const headers = cloneHeaders(this.headers);
    if (init.headers) {
      for (const [key, value] of new Headers(init.headers).entries()) {
        headers.set(key, value);
      }
    }

    const requestInit: RequestInit = {
      ...init,
      method,
      headers,
    };

    if (body !== undefined) {
      if (isFormData(body)) {
        headers.delete("Content-Type");
        requestInit.body = body;
      } else if (this.json && isPlainJsonValue(body)) {
        if (!headers.has("Content-Type")) {
          headers.set("Content-Type", "application/json");
        }
        requestInit.body = JSON.stringify(body);
      } else if (body === null) {
        requestInit.body = "null";
      } else if (isBodyInit(body)) {
        requestInit.body = body;
      } else {
        requestInit.body = JSON.stringify(body);
      }
    }

    const self = this.clone({ headers });
    const nextSelf = hooks.applyFilters<HttpClient>(
      "core/http:requestAfterProcess",
      self,
      url,
      requestInit,
    );

    requestInit.headers = cloneHeaders(nextSelf.headers);

    return fetch(url, requestInit);
  }
}

export function http(): HttpClient {
  return new HttpClient();
}
