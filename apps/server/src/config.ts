export const serverConfig = {
  port: Number(process.env.SERVER_PORT ?? 3001),
  cwd: process.cwd(),
  openAiApiKey: process.env.OPENAI_API_KEY,
  openAiModel: process.env.OPENAI_MODEL ?? "gpt-5",
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
};
