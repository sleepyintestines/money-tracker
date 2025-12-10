import express from "express"
import Coinling from "../schemas/Coinling.js"
import Village from "../schemas/Village.js"
import { protect } from "../middleware/authm.js"

const router = express.Router();

// get all coinlings of current user
router.get("/", protect, async (req, res) => {
    try {
        const coinlings = await Coinling.find({ user: req.user, dead: false }).sort({ createdAt: 1 });
        res.json(coinlings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// delete coinlings (mark as dead)
router.delete("/:id", protect, async (req, res) => {
    try {
        const coinling = await Coinling.findOne({ _id: req.params.id, user: req.user });
        if (!coinling) {
            return res.status(404).json({ message: "Coinling not found!" });
        }

        coinling.dead = true;
        await coinling.save();
        res.json(coinling);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// assign coinling to village
router.post("/", protect, async (req, res) => {
    try {
        // fetch all user villages
        const villages = await Village.find({user: req.user});
        let chosen = null;

        // try to find an available village
        for (const v of villages) {
            const count = await Coinling.countDocuments({village: v._id, dead: false});
            if (count < v.capacity) {
                chosen = v;
                break;
            }
        }

        // if none are available, auto-create a new village
        if (!chosen) {
            // generate starting positions
            const leftPercent = Math.floor(Math.random() * 80) + 10; 
            const topPercent = Math.floor(Math.random() * 80) + 10;

            chosen = await Village.create({
                user: req.user,
                leftPercent,
                topPercent
            });
        }

        // finally create coinling
        const coinling = new Coinling({
            user: req.user,
            village: chosen._id,
            rarity: req.body.rarity
        });

        await coinling.save();
        res.status(201).json(coinling);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router; 