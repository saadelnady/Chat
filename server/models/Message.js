import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  room: { type: String, required: true },
  author: { type: String, required: true },
  role: { type: String, required: true },
  message: { type: String }, // Optional if it's purely a file
  fileUrl: { type: String },
  fileName: { type: String },
  fileType: { type: String }, // e.g., 'image', 'file'
  timestamp: { type: Date, default: Date.now },
  delivered: { type: Boolean, default: false },
  read: { type: Boolean, default: false },
});

export default mongoose.model("Message", MessageSchema);
