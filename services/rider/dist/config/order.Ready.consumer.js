// rider/src/config/orderReady.consumer.ts
import { getChannel } from "./rabbitmq.js";
import { Rider } from "../model/Rider.js";
import axios from 'axios';
export const startOrderReadyConsumer = async () => {
    const channel = getChannel();
    const queue = process.env.ORDER_READY_QUEUE;
    console.log(`🚀 Starting consumer for queue: ${queue}`);
    if (!channel) {
        console.error("❌ RabbitMQ channel not available");
        return;
    }
    channel.consume(queue, async (msg) => {
        if (!msg)
            return;
        try {
            console.log("📨 Received message from queue");
            const event = JSON.parse(msg.content.toString());
            console.log("Event type:", event.type);
            if (event.type !== "ORDER_READY_FOR_RIDER") {
                console.log("Skipping non-order-ready event");
                channel.ack(msg);
                return;
            }
            const { orderId, restaurantId, location } = event.data;
            console.log(`Processing order ${orderId} ready for rider`);
            console.log(`Restaurant location:`, location);
            // Find nearby available riders
            const riders = await Rider.find({
                isAvailable: true,
                isVerified: true,
                location: {
                    $near: {
                        $geometry: location,
                        $maxDistance: 5000, // 5km radius
                    },
                },
            });
            console.log(`Found ${riders.length} nearby riders`);
            if (riders.length === 0) {
                console.log("No riders available nearby");
                channel.ack(msg);
                return;
            }
            // Notify each rider
            for (const rider of riders) {
                console.log(`Notifying rider: ${rider.userId}`);
                try {
                    await axios.post(`${process.env.REALTIME_SERVICE}/api/v1/internal/emit`, {
                        event: "order:available",
                        room: `user:${rider.userId}`,
                        payload: { orderId, restaurantId },
                    }, {
                        headers: {
                            "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
                        }
                    });
                    console.log(`✅ Notified rider ${rider.userId}`);
                }
                catch (error) {
                    console.error(`Failed to notify rider ${rider.userId}:`, error);
                }
            }
            channel.ack(msg);
            console.log("✅ Message acknowledged");
        }
        catch (error) {
            console.error("OrderReady consumer error:", error);
            channel.ack(msg); // Acknowledge to prevent infinite retries
        }
    });
};
