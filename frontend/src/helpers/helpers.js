export const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/";
};

export const getRoomId = (id1, id2) => {
  return [id1, id2].sort().join("_");
};
