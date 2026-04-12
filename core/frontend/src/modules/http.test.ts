import { afterEach, describe, expect, mock, test } from "bun:test";

import { http } from "./http";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("http client", () => {
  test("sends json payloads with fluent headers", async () => {
    const fetchMock = mock(async (_input: RequestInfo | URL, init?: RequestInit) => {
      return new Response(JSON.stringify({ ok: true, init }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const response = await http()
      .withHeader("X-Test", "123")
      .asJson()
      .post("/api/test", { email: "admin@example.com" });

    const payload = await response.json();
    const headers = new Headers(payload.init.headers);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(payload.init.method).toBe("POST");
    expect(headers.get("X-Test")).toBe("123");
    expect(headers.get("Accept")).toBe("application/json");
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(payload.init.body).toBe(JSON.stringify({ email: "admin@example.com" }));
  });

  test("passes through formdata bodies without forcing json content type", async () => {
    const fetchMock = mock(async (_input: RequestInfo | URL, init?: RequestInit) => {
      return new Response(JSON.stringify({ ok: true, init }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const body = new FormData();
    body.set("file", new Blob(["hello"], { type: "text/plain" }), "hello.txt");

    const response = await http()
      .asJson()
      .post("/api/upload", body);

    await response.json();
    const [, init] = fetchMock.mock.calls[0] as [RequestInfo | URL, RequestInit];
    const headers = new Headers(init.headers);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(init.method).toBe("POST");
    expect(headers.get("Accept")).toBe("application/json");
    expect(headers.get("Content-Type")).toBeNull();
    expect(init.body).toBe(body);
  });
});
