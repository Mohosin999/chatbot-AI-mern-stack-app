import serverless from "serverless-http";
import app from "./app";
import mongoose from "mongoose";

const MONGODB_URL = process.env.MONGODB_URL;
if (MONGODB_URL) {
  mongoose.connect(MONGODB_URL).catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });
}

export const handler = serverless(app);

// --- OLD SERVER CODE ---
// import http from "http";
// import { connectDB } from "./db";
//
// const server = http.createServer(app);
// const port = process.env.PORT || 3000;
//
// const main = async (): Promise<void> => {
//   try {
//     await connectDB();
//     server.listen(port, () => { console.log(`Server running on port ${port}`); });
//   } catch (error) {
//     console.log("Database Error"); console.log(error);
//   }
// };
// main();
