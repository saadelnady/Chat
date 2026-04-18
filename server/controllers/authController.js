import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { io } from "../server.js";
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

const register = async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await new User({
      username,
      password: hashedPassword,
      role,
    }).save();

    const userObj = user.toObject();
    delete userObj.password;

    io.emit("new_user_registered", userObj);
    res.status(201).json({ message: "User registered ✅" });
  } catch (error) {
    res.status(400).json({ error: "Username already exists" });
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { _id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" },
    );
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

export default { register, login };
