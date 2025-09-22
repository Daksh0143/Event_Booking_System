import express, { Express } from "express";
import cors from "cors";
import { connectDb } from "./db/db";
import eventRoutes from "./routes/event.routes";

const app: Express = express();
const PORT: number = Number(process.env.PORT) || 8888;

app.use(express.json());
app.use(cors({ credentials: true }));

app.use("/", eventRoutes);

connectDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is listening on ${PORT}`);
  });
}).catch((error: any) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});