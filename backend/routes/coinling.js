import express from "express"
import Coinling from "../schemas/Coinling.js"
import { protect } from "../middleware/authm.js"
import Village from "../schemas/Village.js";

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

// rename coinling
router.patch("/:id/name", protect, async (req, res) => {
    try{
        const userId = req.user;
        const {id} = req.params;
        const {name} = req.body;

        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return res.status(400).json({ error: "Invalid name!" });
        }

        // only update if it belongs to current user
        const coinling = await Coinling.findOneAndUpdate(
            { _id: id, user: userId },
            { name: name.trim() },
            { new: true }
        );

        if (!coinling) {
            return res.status(404).json({ error: "Goober not found or unauthorized!" });
        }

        res.json(coinling);
    }catch (err){
        res.status(500).json({message: err.message});
    }

});

// move coinlings across villages
router.patch("/:id/village", protect, async (req, res) => {
    try{
        const {villageId} = req.body;
        const coinling = await Coinling.findOne({
            _id: req.params.id,
            user: req.user,
            dead: false
        });

        if(!coinling){
            return res.status(404).json({error: "Coinling not found!"});
        }

        // validate target village
        const destination = await Village.findOne({
            _id: villageId,
            user: req.user,
            deleted: false
        });

        if(!destination){
            return res.status(404).json({error: "Destination not found!"});
        }

        // check target village capacity
        const count = await Coinling.countDocuments({
            village: villageId,
            dead: false
        });

        if(count >= destination.capacity){
            return res.status(400).json({error: "Village is full!"});
        }

        coinling.village = villageId;
        await coinling.save();
        res.json({coinling});
    }catch (err){
        res.status(500).json({error: err.message});
    }
});

export default router; 