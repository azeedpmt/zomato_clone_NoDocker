
import mongoose, { Schema, Document } from "mongoose";

export interface IRestaurant extends Document {
  name: string;
  description?: string;
  image: string;
  ownerId: mongoose.Types.ObjectId;
  phone: number;
  isVerified: boolean;
  autoLocation: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  formattedAddress: string;
  isOpen: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const restaurantSchema = new Schema<IRestaurant>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    image: { type: String, required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    phone: { type: Number, required: true },
    isVerified: { type: Boolean, default: false },
    autoLocation: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (val: number[]) => val.length === 2,
          message: "Coordinates must be [longitude, latitude]",
        },
      },
    },
    formattedAddress: { type: String, trim: true },
    isOpen: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Geospatial index for queries
restaurantSchema.index({ autoLocation: "2dsphere" });

export default mongoose.model<IRestaurant>("Restaurant", restaurantSchema);