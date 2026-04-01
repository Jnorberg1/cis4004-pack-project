import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createTrade,
  getMyTrades,
  acceptTrade,
  declineTrade,
  cancelTrade,
} from "../controllers/tradeController.js";

const router = express.Router();

router.post("/", authMiddleware, createTrade);
router.get("/", authMiddleware, getMyTrades);
router.post("/:id/accept", authMiddleware, acceptTrade);
router.post("/:id/decline", authMiddleware, declineTrade);
router.post("/:id/cancel", authMiddleware, cancelTrade);

export default router;
