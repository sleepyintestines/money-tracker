import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import connectDB from "./config/database.js"
import authRoutes from "./routes/auth.js"
import residentRoutes from "./routes/resident.js"
import transactionRoutes from "./routes/transactions.js"
import houseRoutes from "./routes/house.js"
import journalRoutes from "./routes/journal.js"

dotenv.config();
connectDB();

const app = express();

app.use(express.json());
app.use(cors({}));

// register routes
app.use("/api/auth", authRoutes);
app.use("/api/resident", residentRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/houses", houseRoutes);
app.use("/api/journal", journalRoutes);

// start serverS
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on -> ${PORT}`));