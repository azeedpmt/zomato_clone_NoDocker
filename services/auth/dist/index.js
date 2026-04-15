import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import authRoute from "./routes/auth.js";
import cors from 'cors';
// Fix for ES module __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// 👇 Explicitly load .env from project root
dotenv.config({ path: path.resolve(__dirname, "../.env") });
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoute);
const PORT = process.env.PORT || 5000;
app.get("/", (req, res) => {
    res.send("Server is running 🚀");
});
app.listen(PORT, async () => {
    console.log(`Authentication service is running on port ${PORT}`);
    await connectDB();
});
