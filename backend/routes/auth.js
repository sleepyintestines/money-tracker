import express from "express"
import jwt from "jsonwebtoken"
import User from "../schemas/User.js"

const router = express.Router();

const generateToken = (id) => {
    // return the signed jwt so callers receive a token string
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
}

// user registration route
router.post("/register", async (req, res) => {
    const {email, password} = req.body;

    try{
        // input validation 
        if(!email || !password){
            return res.status(400).json({message: "All fields are required!"});
        }

        if(password.length < 8){
            return res.status(400).json({message: "Password must be at least 8 characters!"});
        }

        if(await User.findOne({email})){
            return res.status(400).json({message: "Email already exists!"});
        }

        // create new user
        const user = await User.create({email, password});

        res.json({
            _id: user._id,
            email: user.email,
            balance: user.balance,
            token: generateToken(user._id),
        });
    }catch (err){
        res.status(500).json({message: err.message});
    }
});

// user login route
router.post("/login", async (req, res) => {
    const {email, password} = req.body;

    try{
        // validate inputted email
        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({message: "Invalid login!"});
        }

        // validate inputted password
        const isMatch = await user.matchPassword(password);
        if(!isMatch){
            return res.status(400).json({message: "Invalid login!"});
        }

        res.json({
            _id: user._id,
            email: user.email,
            balance: user.balance,
            token: generateToken(user._id),
        });
    }catch (err){
        res.status(500).json({message: err.message});
    }
});

export default router;