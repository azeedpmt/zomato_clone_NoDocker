// restaurant/src/config/payment.consumer.ts
import { getChannel } from "./rabbitmq.js";
import Order from "../models/Order.js";
import axios from "axios";
export const startPaymentConsumer = async () => {
    const channel = getChannel();
    channel.consume(process.env.PAYMENT_QUEUE, async (msg) => {
        if (!msg)
            return;
        try {
            const event = JSON.parse(msg.content.toString());
            console.log("Received payment event:", event);
            if (event.type !== "PAYMENT_SUCCESS") {
                channel.ack(msg);
                return;
            }
            const { orderId } = event.data;
            console.log("Processing payment success for order:", orderId);
            // Find and update order
            const order = await Order.findOneAndUpdate({
                _id: orderId,
                paymentStatus: { $ne: "paid" },
            }, {
                $set: {
                    paymentStatus: "paid",
                    status: "placed",
                },
                $unset: {
                    expiresAt: 1,
                },
            }, {
                new: true,
            });
            if (!order) {
                console.log("Order not found or already paid:", orderId);
                channel.ack(msg);
                return;
            }
            console.log("✅ Order Placed and Paid:", order._id);
            // Notify restaurant via socket
            await axios.post(`${process.env.REALTIME_SERVICE}/api/v1/internal/emit`, {
                event: "order:new",
                room: `restaurant:${order.restaurantId}`,
                payload: {
                    orderId: order._id,
                },
            }, {
                headers: {
                    "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
                },
            });
            // Also notify the customer
            await axios.post(`${process.env.REALTIME_SERVICE}/api/v1/internal/emit`, {
                event: "order:update",
                room: `user:${order.userId}`,
                payload: {
                    orderId: order._id,
                    status: order.status,
                },
            }, {
                headers: {
                    "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
                },
            });
            console.log("Notifications sent for order:", order._id);
            channel.ack(msg);
        }
        catch (error) {
            console.error("❌ Payment consumer error:", error);
            channel.ack(msg); // Acknowledge to prevent infinite retries
        }
    });
};
