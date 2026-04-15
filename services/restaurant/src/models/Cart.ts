import mongoose,{Schema,Document} from "mongoose";

export interface Icart extends Document{
    userId:mongoose.Types.ObjectId;
    restaurantId:mongoose.Types.ObjectId;
    itemId:mongoose.Types.ObjectId;
    quauntity:number;
    createdAt:Date;
    updatedAt:Date;
}

const schema = new Schema<ICart>({
    userId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        require:true,
        index:true,
    },
    restaurantId:{
        type:Schema.Types.ObjectId,
        ref:"Restaurant",
        require:true,
        index:true,
    },
    itemId:{
        type:Schema.Types.ObjectId,
        ref:"MenuItem",
        require:true,
        index:true,
    },
    quauntity:{
        type:Number,
        default:1,
        min:1,
    },
},{
   timestamps:true,
});

schema.index({userId:1,restaurantId:1,itemId:1},{unique:true});

export default mongoose.model<ICart>("Cart",schema);