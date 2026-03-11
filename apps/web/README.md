# Web

This workspace contains the Next.js client application for the monorepo.

## Scripts

```sh
npm run dev --workspace web
npm run build --workspace web
npm run lint --workspace web
```

The app reads `WEB_PORT` from the root `.env` file. If not set, it defaults to `3000`.
It also reads `NEXT_PUBLIC_SERVER_URL` to know where the Express API is running.

## Structure

- `src/app/layout.tsx`: root layout and metadata
- `src/app/page.tsx`: current agent workflow test page
- `src/app/globals.css`: app-wide styling
- `src/components/stub-page-header.tsx`: simple stub header component
- `src/components/agent-test-panel.tsx`: client-side agent test harness

## Notes

The default `create-next-app` landing page scaffolding has been removed. The workspace now starts from a full-width page with a test harness for the agent workflow.
