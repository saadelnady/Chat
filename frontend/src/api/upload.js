import { API_URL } from "./apiUrl";

export const uploadFile = async (formData) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/upload`, {
    method: "POST",
    body: formData,
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  // 👇 السطرين دول هما الحماية الأوتوماتيكية
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login"; // نطرده لصفحة تسجيل الدخول
    throw new Error("Session expired");
  }
  const data = await response.json();
  return data;
};
