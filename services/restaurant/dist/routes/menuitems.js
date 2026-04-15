// routes/menuitems.js
import express from "express";
import { isAuth, isSeller } from "../middlewares/isAuth.js";
import { addMenuItem, deleteMenuItem, getAllItems, toggleMenuItemAvailability, } from "../controllers/menuitems.js";
import uploadFile from "../middlewares/multer.js";
const router = express.Router();
// Seller routes
router.post("/new", isAuth, isSeller, uploadFile, addMenuItem);
router.delete("/:itemId", isAuth, isSeller, deleteMenuItem);
router.put("/status/:itemId", isAuth, isSeller, toggleMenuItemAvailability);
// Public routes (for customers)
router.get("/restaurant/:restaurantId", isAuth, getAllItems);
//router.get("/all/:restaurantId", getAllItems); // Alternative endpoint for compatibility
export default router;
