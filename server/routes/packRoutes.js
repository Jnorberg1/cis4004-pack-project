import express from "express";
import {
  getAllPacks,
  getMyPackAvailability,
  openPack,
} from "../controllers/packController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getAllPacks);
router.get("/my-availability", authMiddleware, getMyPackAvailability);
router.post("/open/:packId", authMiddleware, openPack);

export default router;