import "dotenv/config";
import express from "express";

const app = express();
const port = Number(process.env.SERVER_PORT ?? 3001);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
