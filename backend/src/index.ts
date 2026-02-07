import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { normalizeUserRequest, type RequestAgentOutput } from "./requestAgent";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/hello", (_req, res) => {
  res.json({ message: "Hello from backend" });
});

app.post("/api/request-agent", async (req, res) => {
  try {
    const body = req.body as unknown;
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      typeof (body as { userRequest?: unknown }).userRequest !== "string"
    ) {
      return res.status(400).json({
        error: "Invalid body. Expected { userRequest: string, context?: { ... } }",
      });
    }

    const { userRequest, context, options } = body as {
      userRequest: string;
      context?: unknown;
      options?: unknown;
    };

    const normalized = await normalizeUserRequest({
      userRequest,
      context:
        context && typeof context === "object" && !Array.isArray(context)
          ? (context as {
              userId?: string;
              locale?: string;
              todayISO?: string;
              previousMessages?: string[];
              previousOutput?: RequestAgentOutput;
            })
          : undefined,
    }, {
      model:
        options && typeof options === "object" && !Array.isArray(options)
          ? (options as { model?: string }).model
          : undefined,
      includePreviousMessages:
        options && typeof options === "object" && !Array.isArray(options)
          ? Boolean((options as { includePreviousMessages?: unknown }).includePreviousMessages)
          : false,
    });

    return res.json(normalized);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${port}`);
});

