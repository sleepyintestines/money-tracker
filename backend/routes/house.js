import express from "express"
import House from "../schemas/House.js"
import Resident from "../schemas/Resident.js"
import { protect } from "../middleware/authm.js"

const router = express.Router();

// get all houses for current user
router.get("/", protect, async (req, res) => {
    try {
        const houses = await House.find({user: req.user, deleted: false}).sort({createdAt: 1});
        res.json(houses);
    } catch (err) {
        res.status(500).json({message: err.message});
    }
});

// get single house and its residents
router.get("/:id", protect, async (req, res) => {
    try {
        console.log("Fetching house:", {houseId: req.params.id, userId: req.user, deleted: false});
        const house = await House.findOne({_id: req.params.id, user: req.user});

        if (!house){
            return res.status(404).json({message: "House not found"});
        } 

        const residents = await Resident.find({house: house._id, dead: false});
        res.json({ house, residents });
    } catch (err) {
        console.error("Error fetching house:", err);
        res.status(500).json({message: err.message});
    }
});

// update house position (persisting)
router.put("/:id/position", protect, async (req, res) => {
    try {
        const {leftPercent, topPercent} = req.body;
        const house = await House.findOne({_id: req.params.id, user: req.user, deleted: false});

        if (!house){
            return res.status(404).json({message: "House not found"});
        }
        if (typeof leftPercent === "number"){
            house.leftPercent = Math.min(Math.max(leftPercent, 0), 100);
        }
        if (typeof topPercent === "number"){
            house.topPercent = Math.min(Math.max(topPercent, 0), 100);
        } 

        await house.save();
        res.json(house);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// merge houses
router.post("/merge", protect, async (req, res) => {
    try{
        const {sourceId, targetId} = req.body;
        console.log("Merge request:", { sourceId, targetId, user: req.user && req.user._id ? req.user._id : req.user });
        
        // fetch both houses and counts in parallel to reduce network round trips
        const [source, target, srcCount, tgtCount] = await Promise.all([
            House.findOne({_id: sourceId, user: req.user, deleted: false}),
            House.findOne({_id: targetId, user: req.user, deleted: false}),
            Resident.countDocuments({house: sourceId, dead: false}),
            Resident.countDocuments({house: targetId, dead: false})
        ]);

        if(!source || !target){
            return res.status(404).json({message: "One or both houses not found!"});
        }

        const srcCap = Number(source.capacity);
        const tgtCap = Number(target.capacity);
        console.log("Capacities:", { srcCap, tgtCap });

        if(srcCap !== tgtCap){
            return res.status(400).json({message: "Houses must have the same capacity, can't merge!"});
        }

        const valid = [2, 4, 8, 16, 32, 64, 128]
        if(!valid.includes(srcCap)){
            return res.status(400).json({ message: "Invalid capacity for merging!"});
        }

        if(srcCap === 128){
            return res.status(400).json({message: "Already at maximum capacity, can't merge!"});
        }

        if(srcCount < srcCap || tgtCount < tgtCap){
            return res.status(400).json({
                message: "Both houses must be full before merging!",
                source:  `${srcCount}/${srcCap}`,
                target: `${tgtCount}/${tgtCap}`
            });
        }

        // execute final operations in parallel
        target.capacity = srcCap * 2;
        await Promise.all([
            target.save(),
            Resident.updateMany(
                {house: source._id},
                {$set: {house: target._id}}
            ),
            House.deleteOne({_id: source._id})
        ]);

        res.json({ message: "Houses merged successfully!", mergedHouse: target });
    }catch (err){
        console.error("Merge error:", err);
        res.status(500).json({message: err.message});
    }
});

// create house
router.post("/create", protect, async (req, res) => {
    try{
        const leftPercent = Math.floor(Math.random() * 80) + 10;
        const topPercent = Math.floor(Math.random() * 80) + 10;

        const house = new House({
            user: req.user,
            leftPercent,
            topPercent,
            name: "House",
            capcity: 2
        });

        await house.save();
        res.status(201).json({house});
    }catch (err){
        res.status(500).json({message: err.message})
    }
});

// delete house
router.delete("/:id", protect, async (req, res) => {
    try{
        const house = await House.findOne({
            _id: req.params.id,
            user: req.user,
            deleted: false
        });

        if(!house){
            return res.status(404).json({message: "House was not found!"});
        }

        // check if house is empty
        const count = await Resident.countDocuments({
            house: house._id,
            dead: false
        });

        if(count > 0){
            return res.status(400).json({message: "House must be empty before deleted!"});
        }

        // soft delete
        house.deleted = true;
        await house.save();
        res.json({message: "House deleted successfully!"});
    }catch (err){
        res.status(500).json({message: err.message});
    }
})

// rename house
router.patch("/:id/name", protect, async (req, res) => {
    try{
        const userId = req.user;
        const {id} = req.params;
        const {name} = req.body;

        if(!name || typeof name !== "string" || name.trim().length === 0){
            return res.status(400).json({error: "Invalid name!"});
        }

        const house = await House.findOneAndUpdate(
            {_id: id, user: userId},
            {name: name.trim()},
            {new: true}
        );

        if(!house){
            return res.status(404).json({error: "House not found!"});
        }

        res.json(house);
    }catch (err){
        res.status(500).json({message: err.message});
    }
});

export default router;