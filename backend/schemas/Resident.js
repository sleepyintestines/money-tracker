import mongoose from "mongoose"
import { getSprite } from "../utils/generateSprite.js"

const  residentScheme = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    house: { type: mongoose.Schema.Types.ObjectId, ref: "House", required: true },
    rarity: {type: String, enum: ["common", "rare", "legendary"]},
    sprite: {type: String},
    name: { type: String, required: true, default: "Resident" },
    personality: {
        type: String,
        enum: [
            "cheerful",
            "grumpy",
            "mysterious",
            "shy",
            "greedy",
        ],
        required: true,
    },
    dialogues: { type: [String], default: [] },
    dead: {type: Boolean, default: false},
}, {timestamps: true});

// assigns rarity
residentScheme.pre("save", function() {
    if(!this.rarity){
        const roll = Math.random();
        if (roll < 0.60) this.rarity = "common";
        else if (roll < 0.99) this.rarity = "rare";
        else this.rarity = "legendary";
    }

    if(!this.sprite){
        this.sprite = getSprite(this.rarity);
    }
});

export default mongoose.model("Resident", residentScheme);