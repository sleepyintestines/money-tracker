import mongoose from "mongoose"

const villageSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, default: "Village" },
    leftPercent: { type: Number, required: true, min: 0, max: 100 },
    topPercent: { type: Number, required: true, min: 0, max: 100 },
    capacity: { type: Number, default: 2 },
    createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model("Village", villageSchema);