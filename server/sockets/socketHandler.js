const { Server } = require("socket.io");
const { socketAuth } = require("../middleware/authMiddleware");
const socketController = require("../controllers/socketController");

const initSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] },
  });

  // Use authentication middleware
  io.use(socketAuth);

  io.on("connection", (socket) => {
    socketController(io, socket);
  });

  return io;
};

module.exports = initSocket;
