import { io } from "socket.io-client";
export const url =
  process.env.NODE_ENV === "production"
    ? undefined
    : process.env.REACT_APP_API_URL;

export const socket = io(url, {
  autoConnect: true,
});
