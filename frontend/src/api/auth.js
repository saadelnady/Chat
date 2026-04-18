import { API_URL } from "./apiUrl";

export const register = async (username, password, role) => {
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "69420", // السطر السحري
    },
    body: JSON.stringify({ username, password, role }),
  });
  return res.json();
};

export const login = async (username, password) => {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "69420", // السطر السحري
    },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
};
