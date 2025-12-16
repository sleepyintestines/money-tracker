import express from "express"
import Transaction from "../schemas/Transaction.js"
import User from "../schemas/User.js"
import Coinling from "../schemas/Coinling.js"
import House from "../schemas/House.js"
import mongoose from "mongoose"
import {protect} from "../middleware/authm.js"
import { randomPersonality, dialoguesFor } from "../utils/generateDialogue.js"
import { randomName } from "../utils/generateName.js"
import { getSprite } from "../utils/generateSprite.js"

const router = express.Router();

async function ensureCoinlingCount(userId, desiredCount){
    // convert userId string to ObjectId for proper database queries
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    const alive = await Coinling.find({user: userObjectId, dead: false}).sort({createdAt: 1}).lean();
    const aliveCount = alive.length;

    // create missing
    if(aliveCount < desiredCount){
        const need = desiredCount - aliveCount;
        
        // fetch houses once and get current counts in single aggregation query
        const houses = await House.find({ user: userObjectId, deleted: false }).lean();
        const houseCounts = await Coinling.aggregate([
            { $match: { user: userObjectId, dead: false } },
            { $group: { _id: "$house", count: { $sum: 1 } } }
        ]);
        
        const countMap = new Map(houseCounts.map(v => [v._id.toString(), v.count]));
        
        // prepare batch of coinlings to create
        const coinlingsToCreate = [];
        let newHouses = [];
        
        for(let i = 0; i < need; i++){
            let chosen = null;
            
            // look for available houses - check ALL houses before creating new one
            for (const v of houses) {
                const currentCount = countMap.get(v._id.toString()) || 0;
                if (currentCount < v.capacity) {
                    chosen = v;
                    countMap.set(v._id.toString(), currentCount + 1);
                    break;
                }
            }

            // only create new house if ALL existing houses are at max capacity
            if (!chosen) {
                // check if we already have a pending new house with space
                const pendingHouse = newHouses.find(nv => {
                    const tempId = nv.tempId;
                    const currentCount = countMap.get(tempId) || 0;
                    return currentCount < nv.capacity;
                });
                
                if (pendingHouse) {
                    chosen = pendingHouse;
                    const tempId = pendingHouse.tempId;
                    const currentCount = countMap.get(tempId) || 0;
                    countMap.set(tempId, currentCount + 1);
                } else {
                    // create new house only when necessary
                    const leftPercent = Math.floor(Math.random() * 80) + 10; 
                    const topPercent = Math.floor(Math.random() * 80) + 10;
                    const tempId = `temp_${Date.now()}_${i}`;
                    chosen = {
                        user: userObjectId,
                        leftPercent,
                        topPercent,
                        capacity: 2,
                        name: "House",
                        tempId // temporary id for tracking before insertion
                    };
                    newHouses.push(chosen);
                    countMap.set(tempId, 1);
                }
            }

            // prepare coinling data
            const personality = randomPersonality();
            
            // manually generate rarity and sprite (since insertMany bypasses pre-save hooks)
            const roll = Math.random();
            let rarity;
            if (roll < 0.60) rarity = "common";
            else if (roll < 0.99) rarity = "rare";
            else rarity = "legendary";
            
            coinlingsToCreate.push({
                user: userObjectId,
                house: chosen._id || chosen.tempId, // use real id or temp id
                name: randomName(),
                personality,
                dialogues: dialoguesFor(personality),
                rarity,
                sprite: getSprite(rarity),
            });
        }
        
        // bulk create new houses if needed
        if (newHouses.length > 0) {
            const created = await House.insertMany(newHouses.map(nv => ({
                user: nv.user,
                leftPercent: nv.leftPercent,
                topPercent: nv.topPercent,
                capacity: nv.capacity,
                name: nv.name
            })));
            
            // create mapping from temp ids to real ids
            const tempIdToRealId = new Map();
            created.forEach((house, idx) => {
                tempIdToRealId.set(newHouses[idx].tempId, house._id);
            });
            
            // update house ids in coinlings
            for (let i = 0; i < coinlingsToCreate.length; i++) {
                const houseId = coinlingsToCreate[i].house;
                if (typeof houseId === 'string' && houseId.startsWith('temp_')) {
                    coinlingsToCreate[i].house = tempIdToRealId.get(houseId);
                }
            }
        }
        
        // bulk create all coinlings at once
        if (coinlingsToCreate.length > 0) {
            await Coinling.insertMany(coinlingsToCreate);
        }

        return;
    }

    // mark dead using bulk update
    if(aliveCount > desiredCount){
        const remove = aliveCount - desiredCount;
        const toKill = alive.slice(0, remove);
        const idsToKill = toKill.map(g => g._id);

        await Coinling.updateMany(
            { _id: { $in: idsToKill } },
            { $set: { dead: true } }
        );

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

// get all categories (default + user custom)
router.get("/categories", protect, async (req, res) => {
    try{
        const { type } = req.query; // 'add' or 'subtract'
        
        const addCategories = [
            "Salary",
            "Allowance",
            "Business",
            "Gift Received",
            "Refund",
            "Investment",
        ];

        const subtractCategories = [
            "Food & Dining",
            "Transportation",
            "Clothes",
            "Entertainment",
            "Bills & Utilities",
            "Healthcare",
            "Education",
            "Gift Given",
        ];

        const defaultCategories = type === "add" ? addCategories : subtractCategories;

        // get unique user-created categories for this transaction type
        const userCategories = await Transaction.distinct("category", {
            user: req.user,
            type: type,
            category: { $exists: true, $nin: [...addCategories, ...subtractCategories] }
        });

        res.json({
            default: defaultCategories,
            custom: userCategories
        });
    }catch (err){
        res.status(500).json({message: err.message});
    }
});

// record new transaction
router.post("/", protect, async(req, res) => {
    const {type, amount, date, notes, worthIt, category} = req.body;

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
            category,
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

        // record all dead coinlings
        const dead = await Coinling.find({
            user: req.user,
            dead: true,
            // get all coinlings marked dead in last second
            updatedAt: {$gte: new Date(Date.now() - 1000)}
        }).select('name sprite rarity');

        // record all new coinlings
        const birthed = await Coinling.find({
            user: req.user,
            dead: false,
            // get all coinlings created in last second
            updatedAt: { $gte: new Date(Date.now() - 1000) }
        }).select('name sprite rarity');

        res.json({
            transaction,
            balance: userDoc.balance,
            dead: dead || [],
            birthed: birthed || []
        });
    }catch (err){
        res.status(500).json({message: err.message});
    }
});

// update transaction (worthIt flag)
router.patch("/:id", protect, async(req, res) => {
    try{
        const {worthIt} = req.body;
        
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            user: req.user
        });

        if(!transaction){
            return res.status(404).json({message: "Transaction not found!"});
        }

        if(typeof worthIt === "boolean"){
            transaction.worthIt = worthIt;
            await transaction.save();
        }

        res.json(transaction);
    }catch (err){
        res.status(500).json({message: err.message});
    }
});

// get analytics data
router.get("/analytics/summary", protect, async(req, res) => {
    try{
        const userObjectId = new mongoose.Types.ObjectId(req.user);
        
        // helper to get start of week (Sunday)
        const getWeekStart = (date) => {
            const d = new Date(date);
            const day = d.getDay();
            const diff = d.getDate() - day;
            return new Date(d.setDate(diff));
        };

        // helper to get start of month
        const getMonthStart = (date) => {
            const d = new Date(date);
            return new Date(d.getFullYear(), d.getMonth(), 1);
        };

        const now = new Date();
        const thisWeekStart = getWeekStart(now);
        thisWeekStart.setHours(0, 0, 0, 0);

        const lastWeekStart = new Date(thisWeekStart);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);

        const twoWeeksAgoStart = new Date(thisWeekStart);
        twoWeeksAgoStart.setDate(twoWeeksAgoStart.getDate() - 14);

        const threeWeeksAgoStart = new Date(thisWeekStart);
        threeWeeksAgoStart.setDate(threeWeeksAgoStart.getDate() - 21);

        const thisMonthStart = getMonthStart(now);
        thisMonthStart.setHours(0, 0, 0, 0);

        // get all transactions
        const transactions = await Transaction.find({user: userObjectId}).lean();

        // this week spending
        const thisWeekSpent = transactions
            .filter(t => t.type === "subtract" && new Date(t.date) >= thisWeekStart)
            .reduce((sum, t) => sum + t.amount, 0);

        // last 3 weeks for comparison
        const lastWeekSpent = transactions
            .filter(t => t.type === "subtract" && new Date(t.date) >= lastWeekStart && new Date(t.date) < thisWeekStart)
            .reduce((sum, t) => sum + t.amount, 0);

        const twoWeeksAgoSpent = transactions
            .filter(t => t.type === "subtract" && new Date(t.date) >= twoWeeksAgoStart && new Date(t.date) < lastWeekStart)
            .reduce((sum, t) => sum + t.amount, 0);

        const threeWeeksAgoSpent = transactions
            .filter(t => t.type === "subtract" && new Date(t.date) >= threeWeeksAgoStart && new Date(t.date) < twoWeeksAgoStart)
            .reduce((sum, t) => sum + t.amount, 0);

        // this month spending
        const thisMonthSpent = transactions
            .filter(t => t.type === "subtract" && new Date(t.date) >= thisMonthStart)
            .reduce((sum, t) => sum + t.amount, 0);

        // this month income
        const thisMonthIncome = transactions
            .filter(t => t.type === "add" && new Date(t.date) >= thisMonthStart)
            .reduce((sum, t) => sum + t.amount, 0);

        // category analysis (only for subtract/expense transactions)
        const categoryStats = {};
        transactions.forEach(t => {
            if (!t.category || t.type !== "subtract") return;
            if (!categoryStats[t.category]) {
                categoryStats[t.category] = {count: 0, total: 0};
            }
            categoryStats[t.category].count++;
            categoryStats[t.category].total += t.amount;
        });

        const mostUsedCategory = Object.entries(categoryStats)
            .sort((a, b) => {
                // primary sort by total amount (descending)
                if (b[1].total !== a[1].total) {
                    return b[1].total - a[1].total;
                }
                // tiebreaker: sort by count (descending)
                return b[1].count - a[1].count;
            })[0];

        // spending by category (only subtract transactions)
        const spendingByCategory = Object.entries(categoryStats)
            .map(([name, data]) => ({name, amount: data.total, count: data.count}))
            .sort((a, b) => b.amount - a.amount);

        // worth it analysis
        const worthItStats = transactions
            .filter(t => t.type === "subtract" && t.worthIt !== undefined)
            .reduce((acc, t) => {
                if (t.worthIt) {
                    acc.worthIt++;
                    acc.worthItAmount += t.amount;
                } else {
                    acc.notWorthIt++;
                    acc.notWorthItAmount += t.amount;
                }
                return acc;
            }, {worthIt: 0, notWorthIt: 0, worthItAmount: 0, notWorthItAmount: 0});

        res.json({
            thisWeek: {
                spent: thisWeekSpent,
                start: thisWeekStart.toISOString()
            },
            weeklyComparison: [
                {week: "3 weeks ago", spent: threeWeeksAgoSpent},
                {week: "2 weeks ago", spent: twoWeeksAgoSpent},
                {week: "Last week", spent: lastWeekSpent},
                {week: "This week", spent: thisWeekSpent}
            ],
            thisMonth: {
                spent: thisMonthSpent,
                income: thisMonthIncome,
                net: thisMonthIncome - thisMonthSpent,
                start: thisMonthStart.toISOString()
            },
            categories: {
                mostUsed: mostUsedCategory ? {
                    name: mostUsedCategory[0],
                    count: mostUsedCategory[1].count,
                    total: mostUsedCategory[1].total
                } : null,
                spendingBreakdown: spendingByCategory
            },
            worthIt: worthItStats
        });
    }catch (err){
        res.status(500).json({message: err.message});
    }
});

export default router;