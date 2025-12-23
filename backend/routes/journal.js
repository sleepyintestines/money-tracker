import express from "express"
import Resident from "../schemas/Resident.js"
import { protect } from "../middleware/authm.js"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// get all available sprite paths organized by rarity
router.get("/sprites", async (req, res) => {
    try {

        const spritesDir = path.join(__dirname, "../../frontend/public/sprites/resident-sprites");
        const rarities = ["common", "rare", "legendary"];
        const allSprites = {};

        for (const rarity of rarities) {
            const rarityDir = path.join(spritesDir, rarity);
            if (fs.existsSync(rarityDir)) {
                const files = fs.readdirSync(rarityDir)
                    .filter(file => file.endsWith('.png'))
                    .map(file => `/sprites/resident-sprites/${rarity}/${file}`);
                allSprites[rarity] = files;
            } else {
                allSprites[rarity] = [];
            }
        }

        res.json(allSprites);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// get user's unlocked sprites
router.get("/unlocked", protect, async (req, res) => {
    try {
        // get distinct sprites from user's residents (both dead and alive)
        const unlocked = await Resident.distinct("sprite", { user: req.user });
        
        res.json({ unlocked });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
