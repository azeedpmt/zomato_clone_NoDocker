import amqp from "amqplib";

let channel: amqp.Channel;
export const connectRabbbitMQ = async()=>{
    const connection =await amqp.connect(process.env.RABBITMQ_URL!);

    channel= await connection.createChannel();

    await channel.assertQueue(process.env.RIDER_QUEUE!,{
        durable:true,
    });

    await channel.assertQueue(process.env.ORDER_READY_QUEUE!,{
        durable:true,
    });
    console.log("🐇 connected to Rabbitmq(Rider service)");
};

export const getChannel=()=>channel;