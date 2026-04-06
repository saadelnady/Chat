const API_URL = process.env.REACT_APP_API_URL;

export const getSellers = async () => {
  const res = await fetch(`${API_URL}/sellers`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  const data = await res.json();
  return data;
};
