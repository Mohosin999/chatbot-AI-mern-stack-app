import "dotenv/config";
import http from "http";
import app from "./app";
import { connectDB } from "./db";

const server = http.createServer(app);

const port = process.env.PORT || 3000;

const main = async (): Promise<void> => {
  try {
    await connectDB();
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.log("Database Error");
    console.log(error);
  }
};

main();
