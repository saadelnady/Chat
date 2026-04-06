import User from "../models/User.js";

const getSellers = async (req, res) => {
  const sellers = await User.find({ role: "seller" }).select("username _id");
  res.json(sellers);
};

export default { getSellers };
