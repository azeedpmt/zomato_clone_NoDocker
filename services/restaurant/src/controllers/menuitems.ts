
import axios from "axios";
import getBuffer from "../config/datauri.js";
import { AuthentictedRequest } from "../middlewares/isAuth.js";
import TryCatch from "../middlewares/trycatch.js";
import Restaurant from "../models/Restaurant.js";
import MenuItems from "../models/MenuItems.js";



// ✅ ADD MENU ITEM
export const addMenuItem = TryCatch(async (req: AuthentictedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Please Login" });
  }

  const restaurant = await Restaurant.findOne({ ownerId: req.user._id });

  if (!restaurant) {
    return res.status(404).json({ message: "No restaurant found" });
  }

  const { name, description, price } = req.body;

  if (!name || !price) {
    return res.status(400).json({
      message: "Name and price are required",
    });
  }

  const file = req.file;

  if (!file) {
    return res.status(400).json({
      message: "Please upload image",
    });
  }

  const fileBuffer = getBuffer(file);

  if (!fileBuffer?.content) {
    return res.status(500).json({
      message: "Failed to create file buffer",
    });
  }

  const { data: uploadResult } = await axios.post(
    `${process.env.UTILS_SERVICE}/api/upload`,
    {
      buffer: fileBuffer.content,
    }
  );

  const item = await MenuItems.create({
    name,
    description,
    price,
    restaurantId: restaurant._id,
    image: uploadResult.url,
    isAvailable: true, // ✅ default
  });

  res.status(201).json({
    success: true,
    message: "Item Added Successfully",
    item,
  });
});


// ✅ GET ALL ITEMS (FIXED)
export const getAllItems = TryCatch(async (req: AuthentictedRequest, res) => {
  const { restaurantId } = req.params;

  console.log("Restaurant ID:", restaurantId);

  if (!restaurantId) {
    return res.status(400).json({
      message: "Restaurant ID is required",
    });
  }

  const items = await MenuItems.find({
    restaurantId,
  }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    items,
  });
});



// ✅ DELETE ITEM (FIXED PARAM)
export const deleteMenuItem = TryCatch(async (req: AuthentictedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Please Login",
    });
  }

  const { itemId } = req.params; // ✅ FIXED

  if (!itemId) {
    return res.status(400).json({
      message: "Item ID is required",
    });
  }

  const item = await MenuItems.findById(itemId);

  if (!item) {
    return res.status(404).json({
      message: "No item found",
    });
  }

  const restaurant = await Restaurant.findOne({
    _id: item.restaurantId,
    ownerId: req.user._id,
  });

  if (!restaurant) {
    return res.status(403).json({
      message: "Unauthorized",
    });
  }

  await item.deleteOne();

  res.json({
    success: true,
    message: "Menu item deleted successfully",
  });
});


// ✅ TOGGLE AVAILABILITY (FIXED)
export const toggleMenuItemAvailability = TryCatch(
  async (req: AuthentictedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Please Login",
      });
    }

    const { itemId } = req.params; // ✅ FIXED

    if (!itemId) {
      return res.status(400).json({
        message: "Item ID is required",
      });
    }

    const item = await MenuItems.findById(itemId);

    if (!item) {
      return res.status(404).json({
        message: "No item found",
      });
    }

    const restaurant = await Restaurant.findOne({
      _id: item.restaurantId,
      ownerId: req.user._id,
    });

    if (!restaurant) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    // ✅ FIXED TYPO
    item.isAvailable = !item.isAvailable;

    await item.save();

    res.json({
      success: true,
      message: `Item marked as ${
        item.isAvailable ? "available" : "unavailable"
      }`,
      item,
    });
  }
);