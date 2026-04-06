import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import { createServer } from "http";
import { Server } from "socket.io";
import sellerRoutes from "./routes/sellerRoutes.js";
import socketConnection from "./middleware/socketConnection.js";

dotenv.config();
const PORT = process.env.PORT || 3001;

// Connect to Database
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/", authRoutes);
app.use("/sellers", sellerRoutes);

// Create Server
const server = createServer(app);
server.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));

export const io = new Server(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"],
  },
});

socketConnection();
