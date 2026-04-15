
import connectDB from "./config/db.js";



import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
// import restaurantRoutes from "./routes/restaraunt.js"
import restaurantRoutes from "./routes/restaraunt.js";
import cors from "cors";
import itemsRoutes from './routes/menuitems.js';
import cartRoutes from './routes/cart.js'
import menuRoutes from "./routes/menuitems.js";
import addressRoutes from "./routes/address.js"
import orderRoutes from "./routes/order.js";
import { connectRabbbitMQ } from "./config/rabbitmq.js";
import { startPaymentConsumer } from "./config/payment.consumer.js";

dotenv.config();

await connectRabbbitMQ();
startPaymentConsumer()

const app = express();

// ✅ Middlewares
app.use(cors());
app.use(express.json()); // ✅ Important: Parse JSON bodies
app.use(express.urlencoded({ extended: true }));

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI as string)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

// ✅ Routes
app.use("/api/restaurant", restaurantRoutes);
app.use("/api/item",itemsRoutes);
app.use("/api/cart",cartRoutes);
app.use("/api/address",addressRoutes);
app.use("/api/order",orderRoutes);

app.use("/api/restaurants", restaurantRoutes);
app.use("/api/items", menuRoutes);

// ✅ Error handling for unknown routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ✅ Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});