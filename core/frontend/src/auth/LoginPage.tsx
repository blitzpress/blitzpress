import { createSignal } from "solid-js";
import { http } from "@blitzpress/plugin-sdk";

const tokenStorageKey = "bp_auth_token";

const LoginPage = () => {
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await http().asJson().post("/api/core/auth/login", {
        email: email(),
        password: password(),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Login failed");
        return;
      }

      const data = await res.json();
      if (data.token) {
        window.localStorage.setItem(tokenStorageKey, data.token);
      }
      window.location.href = "/";
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      "align-items": "center",
      "justify-content": "center",
      "min-height": "100vh",
      "background-color": "#f8fafc",
      "font-family": "'Inter', ui-sans-serif, system-ui, sans-serif",
    }}>
      <div style={{
        width: "100%",
        "max-width": "400px",
        padding: "2rem",
        background: "white",
        "border-radius": "1rem",
        "box-shadow": "0 1px 3px rgba(0,0,0,0.1)",
        border: "1px solid #e2e8f0",
      }}>
        <div style={{ "text-align": "center", "margin-bottom": "2rem" }}>
          <h1 style={{ "font-size": "1.5rem", "font-weight": "700", color: "#1e293b" }}>
            Blitz<span style={{ color: "#818cf8" }}>Press</span>
          </h1>
          <p style={{ color: "#64748b", "font-size": "0.875rem", "margin-top": "0.5rem" }}>
            Sign in to your admin panel
          </p>
        </div>
        {error() && (
          <div style={{
            padding: "0.75rem",
            background: "#fef2f2",
            color: "#dc2626",
            "border-radius": "0.5rem",
            "font-size": "0.875rem",
            "margin-bottom": "1rem",
          }}>
            {error()}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ "margin-bottom": "1rem" }}>
            <label style={{ display: "block", "font-size": "0.875rem", "font-weight": "500", color: "#334155", "margin-bottom": "0.25rem" }}>
              Email
            </label>
            <input
              type="email"
              value={email()}
              onInput={(e) => setEmail(e.currentTarget.value)}
              required
              style={{
                width: "100%",
                padding: "0.625rem 0.75rem",
                border: "1px solid #e2e8f0",
                "border-radius": "0.75rem",
                "font-size": "0.875rem",
                outline: "none",
                "box-sizing": "border-box",
              }}
            />
          </div>
          <div style={{ "margin-bottom": "1.5rem" }}>
            <label style={{ display: "block", "font-size": "0.875rem", "font-weight": "500", color: "#334155", "margin-bottom": "0.25rem" }}>
              Password
            </label>
            <input
              type="password"
              value={password()}
              onInput={(e) => setPassword(e.currentTarget.value)}
              required
              style={{
                width: "100%",
                padding: "0.625rem 0.75rem",
                border: "1px solid #e2e8f0",
                "border-radius": "0.75rem",
                "font-size": "0.875rem",
                outline: "none",
                "box-sizing": "border-box",
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading()}
            style={{
              width: "100%",
              padding: "0.625rem",
              background: "#4f46e5",
              color: "white",
              border: "none",
              "border-radius": "0.75rem",
              "font-size": "0.875rem",
              "font-weight": "500",
              cursor: loading() ? "not-allowed" : "pointer",
              opacity: loading() ? "0.7" : "1",
            }}
          >
            {loading() ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
