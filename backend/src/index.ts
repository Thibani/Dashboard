import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { aboutRouter } from "./routes/about";
import { widgetsRouter } from "./routes/widgets";
import { errorHandler } from "./middleware/error-handler";
import type { Request, Response } from "express";
import { runMigrations } from "./db";
import authRouter from "./routes/auth";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 8080;

app.use(cors());
app.use(express.json());

app.use(aboutRouter);
app.use(widgetsRouter);

app.use("/api/auth", authRouter);
app.use(errorHandler);

// --- Service/widget registry ------------------------------------------

const services = [
  {
    name: "weather",
    widgets: [
      {
        name: "city_temperature",
        description: "Display temperature for a city",
        params: [{ name: "city", type: "string" }],
      },
    ],
  },
  {
    name: "rss",
    widgets: [
      {
        name: "article_list",
        description: "Displaying the list of the last articles",
        params: [
          { name: "link", type: "string" },
          { name: "number", type: "integer" },
        ],
      },
    ],
  },
];

app.get("/about.json", (req: Request, res: Response) => {
  const forwardedFor = req.headers["x-forwarded-for"];

  const clientHost = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(",")[0].trim() ||
      req.socket.remoteAddress ||
      "";

  res.json({
    client: {
      host: clientHost,
    },
    server: {
      current_time: Math.floor(Date.now() / 1000),
      services,
    },
  });
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

async function start() {
  await runMigrations();
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

start();