import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import connectDB from "./config/database.js"
import authRoutes from "./routes/auth.js"
import coinlingRoutes from "./routes/coinling.js"
import transactionRoutes from "./routes/transactions.js"
import villageRoutes from "./routes/village.js"

dotenv.config();
connectDB();

const app = express();

app.use(express.json());
app.use(cors());

// register routes
app.use("/api/auth", authRoutes);
app.use("/api/coinling", coinlingRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/villages", villageRoutes);

// start serverS
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on -> ${PORT}`));