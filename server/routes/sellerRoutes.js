import express from "express";
const router = express.Router();
import sellerController from "../controllers/sellerController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import allowedTo from "../middleware/allowedTo.js";

router.get(
  "/",
  authMiddleware,
  allowedTo("admin"),
  sellerController.getSellers,
);

export default router;
