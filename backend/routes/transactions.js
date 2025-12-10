import express from "express"
import Transaction from "../schemas/Transaction.js"
import User from "../schemas/User.js"
import Coinling from "../schemas/Coinling.js"
import Village from "../schemas/Village.js"
import {protect} from "../middleware/authm.js"
import { randomPersonality, dialoguesFor } from "../utils/generateDialogue.js"
import { randomName } from "../utils/generateName.js"

const router = express.Router();

async function ensureCoinlingCount(userId, desiredCount){
    const alive = await Coinling.find({user: userId, dead: false}).sort({createdAt: 1});
    const aliveCount = alive.length;

    // create missing
    if(aliveCount < desiredCount){
        const need = desiredCount - aliveCount;
        for(let i = 0; i < need; i++){
            // fetch all of user's villages
            const villages = await Village.find({ user: userId });
            let chosen = null;

            // look for available villages
            for (const v of villages) {
                const count = await Coinling.countDocuments({village: v._id, dead: false});
                if (count < v.capacity) {
                    chosen = v;
                    break;
                }
            }

            // if none available, auto-create new village
            if (!chosen) {
                // generate starting positions
                const leftPercent = Math.floor(Math.random() * 80) + 10; 
                const topPercent = Math.floor(Math.random() * 80) + 10;
                chosen = await Village.create({
                    user: userId,
                    leftPercent,
                    topPercent
                });
            }

            // create coinling in the chosen village
            const personality = randomPersonality();
            await Coinling.create({
                user: userId,
                village: chosen._id,
                name: randomName(),
                personality,
                dialogues: dialoguesFor(personality),
            });
        }

        return;
    }

    // mark dead
    if(aliveCount > desiredCount){
        const remove = aliveCount - desiredCount;
        const toKill = alive.slice(0, remove);

        for(const g of toKill){
            g.dead = true;
            await g.save();
        }

        return;
    }
}

// get all transactions of current user
router.get("/", protect, async (req, res) => {
    try{
        const transactions = await Transaction.find({user: req.user}).sort({createdAt: -1});
        res.json(transactions);
    }catch (err){
        res.status(500).json({message: err.message});
    }
});

// record new transaction
router.post("/", protect, async(req, res) => {
    const {type, amount, date, notes, worthIt} = req.body;

    if(!type || typeof amount !== "number"){
        return res.status(400).json({message: "Missing type or amount!"});
    }

    try{
        // create transaction
        const transaction = await Transaction.create({
            user: req.user,
            type, 
            amount,
            date,
            notes, 
            worthIt,
        });

        // update the balance
        const userDoc = await User.findById(req.user);
        userDoc.balance = type === "add" 
            ? userDoc.balance + amount
            : userDoc.balance - amount;
        await userDoc.save();

        // update amount of coinlings
        const desiredCount = Math.max(0, Math.floor(userDoc.balance / 1000));
        await ensureCoinlingCount(req.user, desiredCount);

        res.json({
            transaction, 
            balance: userDoc.balance
        });
    }catch (err){
        res.status(500).json({message: err.message});
    }
});

export default router;