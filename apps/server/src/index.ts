import "dotenv/config";
import cors from "cors";
import express from "express";
import { serverConfig } from "./config.js";
import { agentsRouter } from "./routes/agents.js";
import { healthRouter } from "./routes/health.js";
import { usersRouter } from "./routes/users.js";

const app = express();

app.use(
  cors({
    origin: serverConfig.webOrigin,
  }),
);
app.use(express.json());
app.use("/health", healthRouter);
app.use("/users", usersRouter);
app.use("/agents", agentsRouter);

app.listen(serverConfig.port, () => {
  console.log(`Server listening on http://localhost:${serverConfig.port}`);
});
