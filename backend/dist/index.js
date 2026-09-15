"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 8080;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// --- Service/widget registry ------------------------------------------
// This is the single source of truth for /about.json. As real services
// and widgets get built, register them here (or replace with a DB-backed
// registry) rather than hand-editing the JSON shape below.
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
app.get("/about.json", (req, res) => {
    const forwardedFor = req.headers["x-forwarded-for"];
    const clientHost = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : forwardedFor?.split(",")[0].trim() || req.socket.remoteAddress || "";
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
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
