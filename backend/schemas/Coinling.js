import mongoose from "mongoose"

const  coinlingSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    village: { type: mongoose.Schema.Types.ObjectId, ref: "Village", required: true },
    rarity: {type: String, enum: ["common", "rare", "legendary"]},
    dead: {type: Boolean, default: false},
}, {timestamps: true});

// assigns rarity
coinlingSchema.pre("save", function() {
    if(!this.rarity){
        const roll = Math.random();
        if (roll < 0.60) this.rarity = "common";
        else if (roll < 0.90) this.rarity = "rare";
        else this.rarity = "legendary";
    }
});

export default mongoose.model("Coinling", coinlingSchema);