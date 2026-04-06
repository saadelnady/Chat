const userColors = [
  "#fecaca",
  "#fde047",
  "#86efac",
  "#93c5fd",
  "#c4b5fd",
  "#fbcfe8",
  "#bef264",
  "#7dd3fc",
  "#a7f3d0",
  "#fca5a5",
];

export const getColorForUser = (username) => {
  if (!username) return "#86efac";
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return userColors[Math.abs(hash) % userColors.length];
};
