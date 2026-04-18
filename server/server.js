import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import { createServer } from "http";
import { Server } from "socket.io";
import sellerRoutes from "./routes/sellerRoutes.js";
import socketConnection from "./middleware/socketConnection.js";
import upload from "./middleware/uploadMiddleware.js";
import { uploadFile } from "./controllers/uploadControllers.js";
import authMiddleware from "./middleware/authMiddleware.js";
import allowedTo from "./middleware/allowedTo.js";

dotenv.config();
const PORT = process.env.PORT || 3000;

// ES Modules __dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to Database
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; connect-src 'self' http://localhost:3000 http://localhost:5000 ws://localhost:3000 ws://localhost:5000",
  );
  next();
});

// Serve uploads folder as static
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// File upload endpoint
app.post(
  "/upload",
  authMiddleware,
  allowedTo("admin", "seller"),
  upload.single("file"),
  uploadFile,
);

// Routes
app.use("/", authRoutes);
app.use("/sellers", sellerRoutes);

// Create Server
const server = createServer(app);
server.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));

export const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3001"],
    methods: ["GET", "POST"],
  },
});

socketConnection();
