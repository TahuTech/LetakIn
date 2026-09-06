import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load .env dari root project (satu level di atas server/)
config({ path: path.resolve(__dirname, "../.env") });

export const prisma = new PrismaClient();
