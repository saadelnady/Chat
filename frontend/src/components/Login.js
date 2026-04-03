import { useState } from "react";
import { login } from "../api/auth";
import { useTranslation } from "react-i18next";

export default function Login({ onLogin, setShowRegister }) {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = await login(username, password);
    setLoading(false);
    if (data.token) {
      localStorage.setItem("token", data.token);
      onLogin();
    } else {
      setError(data.error || t("login.error_msg"));
    }
  };

  return (
    <div className="auth-container">
      <h2>{t("login.title")}</h2>
      <form onSubmit={handleLogin}>
        <div className="input-group">
          <input
            placeholder={t("login.username")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <input
            placeholder={t("login.password")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? t("login.loading_msg") : t("login.button")}
        </button>
      </form>
      {error && <div className="error-text">{error}</div>}

      <div className="switch-hint">
        {t("login.no_account")}
        <button
          className="switch-link"
          onClick={() => setShowRegister(true)}
          type="button"
        >
          {t("login.register_now")}
        </button>
      </div>
    </div>
  );
}
