import express from "express"
import Village from "../schemas/Village.js"
import Coinling from "../schemas/Coinling.js"
import { protect } from "../middleware/authm.js"

const router = express.Router();

// get all villages for current user
router.get("/", protect, async (req, res) => {
    try {
        const villages = await Village.find({user: req.user}).sort({createdAt: 1});
        res.json(villages);
    } catch (err) {
        res.status(500).json({message: err.message});
    }
});

// get single village and its coinlings
router.get("/:id", protect, async (req, res) => {
    try {
        const village = await Village.findOne({_id: req.params.id, user: req.user});

        if (!village){
            return res.status(404).json({message: "Village not found"});
        } 

        const coinlings = await Coinling.find({village: village._id, dead: false});
        res.json({village, coinlings});
    } catch (err) {
        res.status(500).json({message: err.message});
    }
});

// update village position (persisting)
router.put("/:id/position", protect, async (req, res) => {
    try {
        const {leftPercent, topPercent} = req.body;
        const village = await Village.findOne({_id: req.params.id, user: req.user});

        if (!village){
            return res.status(404).json({message: "Village not found"});
        }
        if (typeof leftPercent === "number"){
            village.leftPercent = Math.min(Math.max(leftPercent, 0), 100);
        }
        if (typeof topPercent === "number"){
            village.topPercent = Math.min(Math.max(topPercent, 0), 100);
        } 

        await village.save();
        res.json(village);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;