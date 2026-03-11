# Apps

This directory contains the deployable application workspaces in the monorepo.

## Workspaces

- `web`: Next.js client application
- `server`: TypeScript Express API server

Each app owns its own dependencies and scripts, while the repo root can run them together through npm workspaces and `turbo`.
