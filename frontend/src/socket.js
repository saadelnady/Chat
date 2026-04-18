import { io } from "socket.io-client";
export const url =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_URL
    : "http://localhost:3000";

export const socket = io(url, {
  autoConnect: true,
  extraHeaders: {
    "ngrok-skip-browser-warning": "69420", // <-- السطر السحري للسوكيت
  },
});
