export const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/";
};

export const getRoom = (user, selectedSeller) => {
  return user.role === "seller"
    ? `seller_${user._id}`
    : user.role === "admin"
      ? `seller_${selectedSeller?._id}`
      : null;
};
