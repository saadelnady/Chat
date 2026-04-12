const API_URL = process.env.REACT_APP_API_URL;

export const getSellers = async () => {
  try {
    const res = await fetch(`${API_URL}/sellers`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching sellers:", error);
    throw error;
  }
};
