import { AuthentictedRequest } from "../middlewares/isAuth.js";
import TryCatch from "../middlewares/trycatch.js";
import Address from "../models/Address.js";

// ---------------- Add Address ----------------
export const addAddress = TryCatch(async (req: AuthentictedRequest, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { mobile, formattedAddress, latitude, longitude } = req.body;

  // Validate input
  if (!mobile || !formattedAddress || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ message: "Please provide all fields" });
  }

  const newAddress = await Address.create({
    userId: user._id.toString(), // ensure string type
    mobile,
    formattedAddress,
    location: {
      type: "Point",
      coordinates: [Number(longitude), Number(latitude)],
    },
  });

  res.status(201).json({
    message: "Address added successfully",
    address: newAddress,
  });
});

// ---------------- Delete Address ----------------
export const deleteAddress = TryCatch(async (req: AuthentictedRequest, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "Address ID is required" });
  }

  const address = await Address.findOne({ _id: id, userId: user._id.toString() });
  if (!address) {
    return res.status(404).json({ message: "Address not found" });
  }

  await address.deleteOne();
  res.json({ message: "Address deleted successfully" });
});

// ---------------- Get My Addresses ----------------
export const getMyAddresses = TryCatch(async (req: AuthentictedRequest, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const addresses = await Address.find({ userId: user._id.toString() })
    .sort({ createdAt: -1 });

  if (!addresses || addresses.length === 0) {
    console.log(`No addresses found for user: ${user._id}`);
  } else {
    console.log(`Found ${addresses.length} addresses for user: ${user._id}`);
  }

  res.json(addresses);
});