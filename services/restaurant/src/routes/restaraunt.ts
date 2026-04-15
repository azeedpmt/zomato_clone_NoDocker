
//src/routes/restaraunt.ts
import express from "express";
import { isAuth, isSeller } from "../middlewares/isAuth.js";
import {
  addRestraunt,
  fetchMyRestauarant,
  fetchSingleRestaurant,
  getNearbyRestaurant,
  updateRestaurant,
  updateStatusRestaurant,
  getAllRestaurants
} from "../controllers/restaraunt.js";
import uploadFile from "../middlewares/multer.js";

const router = express.Router();

router.post("/new", isAuth, isSeller, uploadFile, addRestraunt);
router.get("/my", isAuth, isSeller, fetchMyRestauarant);
router.put("/status", isAuth, isSeller, updateStatusRestaurant);
router.put("/edit", isAuth, isSeller, updateRestaurant);
router.get("/all",getNearbyRestaurant);
router.get("/:id",fetchSingleRestaurant);
router.get("/", getAllRestaurants);

export default router;