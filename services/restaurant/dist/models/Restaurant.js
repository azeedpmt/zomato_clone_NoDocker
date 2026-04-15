import mongoose, { Schema } from "mongoose";
const restaurantSchema = new Schema({
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
                validator: (val) => val.length === 2,
                message: "Coordinates must be [longitude, latitude]",
            },
        },
    },
    formattedAddress: { type: String, trim: true },
    isOpen: { type: Boolean, default: false },
}, {
    timestamps: true,
});
// Geospatial index for queries
restaurantSchema.index({ autoLocation: "2dsphere" });
export default mongoose.model("Restaurant", restaurantSchema);
