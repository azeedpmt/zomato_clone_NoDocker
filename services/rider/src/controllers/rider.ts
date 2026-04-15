import getBuffer from "../config/datauri.js";
import { AuthentictedRequest } from "../middlewares/isAuth.js";
import TryCatch from "../middlewares/trycatch.js";
import axios from 'axios';
import { Rider } from "../model/Rider.js";

export const addRiderProfile =TryCatch(
    async(req:AuthentictedRequest,res)=>{
        const user =req.user;
        if(!user){
            return res.status(401).json({
                message:"Unauthorized",
            })
        }
        if(user.role!=="rider"){
            return res.status(403).json({
                message:"Only riders can create rider profile",
            });
        }

        const file=req.file;

        if(!file){
            return res.status(400).json({
                message:"Rider Image is required"
            });
        }
        const fileBuffer =getBuffer(file);

        if(!fileBuffer?.content){
            return res.status(500).json({
                message:"Failed to generate image buffer",
            });
        }

        const {data: uploadResult}=await axios.post(
            `${process.env.UTILS_SERVICE}/api/upload`,{
                buffer:fileBuffer.content,            
            }
        )

        const {phoneNumber,
            aadharNumber,
            drivingLicenseNumber,
            latitude,
            longitude,
        }=req.body;

        if(!phoneNumber ||!aadharNumber ||!drivingLicenseNumber ||latitude===undefined||longitude===undefined){
            return res.status(400).json({
                message:"All field are required",
            })
        }

        const existingProfile = await Rider.findOne({
            userId:user._id,
        })

        if(existingProfile){
            return res.status(400).json({
                message:"Rider profile already exist"
            })
        }

        const riderProfile = await Rider.create({
            userId:user._id,
            picture:uploadResult.url,
            phoneNumber,
            aadharNumber,
            drivingLicenseNumber,
            location:{
                type:"Point",
                coordinates:[longitude,latitude],
            },
            isAvailable:false,
            isVerified:false,
        });

        return res.status(201).json({
            message:"Rider profile created successfully",
            riderProfile,
        })
    }
);

export const fetchMyProfile=TryCatch(async(req:AuthentictedRequest,res)=>{
    const user=req.user;

    if(!user){
        return res.status(401).json({
            message:"Unauthorized",
        });
    }

    const account=await Rider.findOne({userId:user._id});

    res.json(account);
});

export const toggleRiderAvailablity=TryCatch(async(req:AuthentictedRequest,res)=>{
    const user =req.user;
        if(!user){
            return res.status(401).json({
                message:"Unauthorized",
            })
        }
        if(user.role!=="rider"){
            return res.status(403).json({
                message:"Only riders can create rider profile",
            });
        }

        const {isAvailable,latitude,longitude}=req.body;

        if(typeof isAvailable !=="boolean"){
            return res.status(400).json({
                message:"isAvailabe must be boolean",
            });
        }

        if(latitude=== undefined || longitude===undefined){
            return res.status(400).json({
                message:"location is required",
            })
        }

        const rider = await Rider.findOne({
            userId:user._id,
        });

        if(!rider){
            return res.status(404).json({
                message:"Rider Profile is not found"
            })
        }
        if(isAvailable&&!rider.isVerified){
            return res.status(403).json({
                message:"Rider is not verified",
            })
        }
        rider.isAvailable=isAvailable

        rider.location={
            type:"Point",
            coordinates:[longitude,latitude]
        }
        rider.lastActiveAt=new Date();

        await rider.save();

        res.json({
            message:isAvailable?"Rider is now online":"Rider is now offline",
            rider
        })


})


export const acceptOrder =TryCatch(async(req:AuthentictedRequest,res)=>{
    const riderUserId=req.user?._id;
    const {orderId}=req.params;

    if(!riderUserId){
        return res.status(400).json({
            message:"Please Login",
        })
    }

    const rider = await Rider.findOne({userId:riderUserId,isAvailable:true});

    if(!rider){
        return res.status(404).json({message:"rider not found"});
    }

    try {
        const { data } = await axios.put(`${process.env.RESTAURANT_SERVICE}/api/order/assign/rider`,{
            orderId,
            riderId:rider._id.toString(),
            riderUserId:rider.userId,
            riderName:rider.picture,
            riderPhone:rider.phoneNumber,
        },{
            headers:{
                "x-internal-key":process.env.INTERNAL_SERVICE_KEY,
            }
        }
    );

    if(data.success){
        const riderDetails = await Rider.findByIdAndUpdate({
            userId:riderUserId,
            isAvailable:true,
        },{isAvailable:false},
    {new:true})

    res.json({
        message:"Order accepted"
    })
    }
    } catch (error) {
        res.status(400).json({
            message:"Order already taken"
        })
    }
})


export const fetchMyCurrentOrder = TryCatch(async (req: AuthentictedRequest, res) => {
    const riderUserId = req.user?._id;

    if (!riderUserId) {
        return res.status(400).json({
            message: "Please Login",
        });
    }

    const rider = await Rider.findOne({ userId: riderUserId, isVerified: true });
    if (!rider) {
        return res.json({ order: null });
    }

    try {
        const { data } = await axios.get(
            `${process.env.RESTAURANT_SERVICE}/api/order/current/rider?riderId=${rider._id}`,
            {
                headers: {
                    "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
                }
            }
        );

        console.log("Current order response:", data);

        // Handle different response structures
        let orderData = null;
        if (data && data.order) {
            orderData = data.order;
        } else if (data && data._id) {
            orderData = data;
        }

        res.json({
            order: orderData,
        });
    } catch (error: any) {
        console.error("Error fetching current order:", error.message);
        res.json({ order: null });
    }
});

export const updateOrderStatus = TryCatch(async (req: AuthentictedRequest, res) => {
    const userId = req.user?._id;

    if (!userId) {
        return res.status(401).json({
            message: "Please Login",
        });
    }

    const rider = await Rider.findOne({ userId: userId });

    if (!rider) {
        return res.status(404).json({
            message: "Rider not found",
        });
    }

    const { orderId } = req.params;

    try {
        const { data } = await axios.put(
            `${process.env.RESTAURANT_SERVICE}/api/order/update/status/rider`,
            { orderId },
            {
                headers: {
                    "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
                }
            }
        );

        res.json({
            message: data.message,
        });
    } catch (error: any) {
        console.error("Update order status error:", error.response?.data || error.message);
        res.status(500).json({
            message: error.response?.data?.message || "Internal server error",
        });
    }
});
