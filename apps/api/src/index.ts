import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import chatRoutes from "./routes/chat.js";

// Debug: Check if API key is loaded
console.log(
  "OPENROUTER_API_KEY:",
  process.env.OPENROUTER_API_KEY
    ? `SET (${process.env.OPENROUTER_API_KEY.substring(0, 15)}...)`
    : "NOT SET"
);

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://yumly.ai",
  "https://www.yumly.ai",
  "https://yumly-web.onrender.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api", chatRoutes);

// Error handler
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

app.listen(PORT, () => {
  console.log(`🍽️  Yum API server running on http://localhost:${PORT}`);
});
