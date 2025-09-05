import jwt from "jsonwebtoken";
import { Session } from "../models/Session.model.js";

export const isAuthenticated = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Unauthorized, token missing" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res
        .status(401)
        .json({ message: "Unauthorized, token invalid or expired" });
    }

    if (!decoded?.id) {
      return res
        .status(401)
        .json({ message: "Unauthorized, invalid token payload" });
    }

    const session = await Session.findOne({
      userId: decoded.id,
      token,
    }).populate("userId");

    if (!session) {
      return res
        .status(403)
        .json({ message: "Token is invalid or revoked" });
    }

    req.user = session.userId;

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
