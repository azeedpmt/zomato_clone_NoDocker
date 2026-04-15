// import express from "express";
// import dotenv from "dotenv"
// import connectDB from "./config/db.js";
// import cors from 'cors';
// import riderRoutes from "./routes/rider.js"
// import { connectRabbbitMQ } from "./config/rabbitmq.js";
// import { startOrderReadyConsumer } from "./config/order.Ready.consumer.js";
// dotenv.config();
// await connectRabbbitMQ();
// startOrderReadyConsumer()

// const app=express();
// app.use(express.json());
// app.use(cors());

// app.use("/api/rider",riderRoutes)

// app.listen(process.env.PORT,()=>{
//     console.log(`Rider Service is Running on port ${process.env.PORT}`);
//     connectDB()
// })

// rider/index.ts
// rider/index.ts

import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from 'cors';
import riderRoutes from "./routes/rider.js";
import { connectRabbbitMQ } from "./config/rabbitmq.js";
import { startOrderReadyConsumer } from "./config/order.Ready.consumer.js"; // ✅ Fixed import name

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Connect to RabbitMQ first
const startServices = async () => {
    try {
        await connectRabbbitMQ();
        console.log("✅ RabbitMQ connected");
        
        await startOrderReadyConsumer();
        console.log("✅ Order ready consumer started");
    } catch (error) {
        console.error("❌ Failed to start services:", error);
    }
};

startServices();

app.use("/api/rider", riderRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`🚀 Rider Service is running on port ${PORT}`);
    connectDB();
});