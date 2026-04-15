// restaurant/src/config/order.publisher.ts
import { getChannel } from "./rabbitmq.js";
export const publishEvent = async (type, data) => {
    try {
        const channel = getChannel();
        const queue = process.env.ORDER_READY_QUEUE;
        if (!queue) {
            console.error("ORDER_READY_QUEUE not defined");
            return;
        }
        const message = Buffer.from(JSON.stringify({ type, data }));
        channel.sendToQueue(queue, message, { persistent: true });
        console.log(`✅ Published ${type} event to queue:`, queue);
    }
    catch (error) {
        console.error("Failed to publish event:", error);
    }
};
