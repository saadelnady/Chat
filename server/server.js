require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const initSocket = require("./sockets/socketHandler");

const PORT = process.env.PORT || 3001;

// Connect to Database
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/", authRoutes);

// Create Server
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

server.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));
