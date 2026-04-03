import { useState } from "react";
import { register } from "../api/auth";
import { useTranslation } from "react-i18next";

export default function Register({ onRegister }) {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("seller");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = await register(username, password, role);
    setLoading(false);
    if (data.message) {
      onRegister();
    } else {
      setError(data.error || t("register.error_msg"));
    }
  };

  return (
    <div className="auth-container">
      <h2>{t("register.title")}</h2>
      <form onSubmit={handleRegister}>
        <div className="input-group">
          <input
            placeholder={t("register.username")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <input
            placeholder={t("register.password")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="seller">{t("seller")}</option>
            <option value="admin">{t("admin")}</option>
          </select>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? t("register.loading_msg") : t("register.button")}
        </button>
      </form>
      {error && <div className="error-text">{error}</div>}

      <div className="switch-hint">
        {t("register.has_account")}
        <button
          className="switch-link"
          onClick={() => onRegister()}
          type="button"
        >
          {t("register.login_now")}
        </button>
      </div>
    </div>
  );
}
