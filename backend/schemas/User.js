import mongoose from "mongoose"
import bcrypt from "bcryptjs"

// user schema definition
const userSchema = new mongoose.Schema({
    email:{type: String, required: true, unique: true},
    password:{type: String, required: true},
    balance: {type: Number, default: 0},
}, {timestamps: true});

// password hashing 
userSchema.pre("save", async function(){
    if(!this.isModified("password")) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// compares password (for login)
userSchema.methods.matchPassword = async function(enteredPassword){
    return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);