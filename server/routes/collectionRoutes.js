import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getMyCollection,
  getCollectionByUsername,
  toggleFavorite,
  deleteCollectionItem,
} from "../controllers/collectionController.js";

const router = express.Router();

router.get("/", authMiddleware, getMyCollection);
router.get("/user/:username", authMiddleware, getCollectionByUsername);
router.put("/favorite/:id", authMiddleware, toggleFavorite);
router.delete("/:id", authMiddleware, deleteCollectionItem);

export default router;