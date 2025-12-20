import mongoose, { connect } from "mongoose"

// connects nodejs app to mongodb database
const connectDB = async () => {
    try{
        // reads connection uri
        const uri = process.env.MONGO_URI;
        console.log("Connecting to ->", uri);

        // tries to establish connection
        await mongoose.connect(uri);
        console.log("MongoDB Connected!");
    }catch (err){
        console.error("MongoDB Error ->", err.message);
        process.exit(1);
    }
};

export default connectDB;