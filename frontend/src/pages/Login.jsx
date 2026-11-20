import { useState } from "react";
import { login } from "../services/api";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const user = await login(username.trim(), password);
      setPassword("");
      onLogin(user);
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="brand-icon" aria-hidden="true">+</div>
        <span className="eyebrow">HEALTHCARE ANALYTICS SYSTEM</span>
        <h1 id="login-title">Sign in</h1>
        <p>Sign in with your authorized department account.</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="login-username">Username</label>
            <input
              autoComplete="username"
              id="login-username"
              maxLength={128}
              onChange={(event) => setUsername(event.target.value)}
              required
              value={username}
            />
          </div>

          <div className="form-field">
            <label htmlFor="login-password">Password</label>
            <input
              autoComplete="current-password"
              id="login-password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </div>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <button
            className="primary-button"
            disabled={submitting}
            type="submit"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default Login;
