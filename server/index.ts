import express from "express";
import cors from "cors";
import { racksRouter } from "./routes/racks.js";
import { binsRouter } from "./routes/bins.js";
import { itemsRouter } from "./routes/items.js";
import { transactionsRouter } from "./routes/transactions.js";
import { categoriesRouter } from "./routes/categories.js";
import { backupRouter } from "./routes/backup.js";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/api/racks", racksRouter);
app.use("/api/bins", binsRouter);
app.use("/api/items", itemsRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api", backupRouter);

// Error handler — log stack agar mudah debug
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err instanceof Error ? err.message : "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`API server jalan di http://localhost:${PORT}`);
});
