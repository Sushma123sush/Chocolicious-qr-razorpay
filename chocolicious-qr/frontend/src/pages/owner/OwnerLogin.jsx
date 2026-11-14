import { useState } from "react";
import { loginOwner } from "../../services/authService.js";
import { setOwnerToken } from "../../services/ownerApiClient.js";

export default function OwnerLogin({ onSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoggingIn(true);
    try {
      const { token } = await loginOwner(username, password);
      setOwnerToken(token);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="owner-login">
      <form className="owner-login__form" onSubmit={handleSubmit}>
        <h1 className="owner-login__title">Owner Login</h1>
        <label className="product-form__field">
          <span>Username</span>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
        </label>
        <label className="product-form__field">
          <span>Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        {error && <p className="owner-error">{error}</p>}
        <button type="submit" className="btn btn--primary btn--full" disabled={loggingIn}>
          {loggingIn ? "Logging in\u2026" : "Log In"}
        </button>
      </form>
    </div>
  );
}