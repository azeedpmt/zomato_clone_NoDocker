import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import { addToCart, clearCart, decrementCartItem, fetchMyCart, incrementCartItem,removeCartItem } from "../controllers/cart.js";

const router=express.Router();
router.post("/add",isAuth,addToCart);
router.get("/all",isAuth,fetchMyCart);
router.put("/inc",isAuth,incrementCartItem);
router.put("/dec",isAuth,decrementCartItem);
router.put("/clear",isAuth,clearCart);
router.delete("/remove", isAuth, removeCartItem);

export default router;