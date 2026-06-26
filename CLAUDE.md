# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the repo root unless noted.

```bash
# Install all dependencies (first time setup)
npm install && cd server && npm install && cd ../client && npm install && cd ..

# Start dev servers (backend :3001, frontend :5173)
npm run dev

# Run all tests (backend Jest + frontend Vitest)
npm run test:all

# Backend tests only
npm run test:server

# Frontend tests only
npm run test:client

# Run a single backend test file
cd server && npx jest tests/unit/models/GameSession.test.js

# Run a single frontend test file
cd client && npx vitest run tests/unit/store/hostStore.test.ts

# Backend unit tests only
cd server && npm run test:unit

# Backend integration tests only
cd server && npm run test:integration

# Coverage reports (output to server/coverage/ and client/coverage/)
npm run test:coverage:all

# E2E tests (requires `npm run dev` running in another terminal)
npm run test:e2e

# Production build (outputs to client/dist/, served by Express in production)
npm run build
```

## Architecture

This is a Kahoot-style real-time Bible quiz game. The repo is a monorepo with root-level npm scripts that orchestrate the `server/` and `client/` workspaces.

### Backend (`server/`)

Strict four-layer architecture — each layer only talks to the one below it:

```
Routes / Socket handlers  →  Service layer  →  Repository layer  →  Data (JSON files)
```

- **Routes** (`src/routes/`): HTTP-only, thin wrappers that call `QuizService`
- **Socket handlers** (`src/socket/`): Three files — `hostHandlers.js`, `playerHandlers.js`, `displayHandlers.js` — each registers events on one socket and delegates to `GameService`
- **`QuizService`** (`src/services/QuizService.js`): Quiz CRUD business logic, validates questions (exactly 4 options, `correctIndex` 0–3, `timeLimit` from the allowed set)
- **`GameService`** (`src/services/GameService.js`): Owns the game loop — `createSession`, `startQuestion`, `startTimer`, `revealAnswer`, `showLeaderboard`, `nextQuestion`, `endGame`. Stores all active sessions in a module-level `Map` (in-memory, lost on restart).
- **`GameSession`** (`src/models/GameSession.js`): The state machine. Enforces valid transitions via `VALID_TRANSITIONS`. Scoring is server-authoritative: `Math.ceil((questionEndTime - Date.now()) / 1000)`, minimum 1 point.
- **`QuizRepository`**: Reads/writes quiz JSON files from `server/data/quizzes/` (one file per quiz, named `{uuid}.json`).

### Socket Room Naming

Every socket joins rooms to scope broadcasts:

| Room | Members |
|------|---------|
| `game:GAMECODE` | All players + host |
| `host:GAMECODE` | Host only |
| `display:GAMECODE` | Display screen only |

Events are prefixed by receiver: `host:*`, `player:*`, `display:*`.

### Frontend (`client/`)

React 18 + TypeScript + Vite. Five pages map to the five URL routes; each page owns a Zustand store.

- **Stores** (`src/store/`): `quizStore`, `hostStore`, `playerStore`, `displayStore` — one per role. Stores hold derived UI state only; the source of truth is the server.
- **`socketService`** (`src/services/socketService.ts`): Single thin wrapper around the shared `socket.ts` singleton. All socket emits go through here; all socket listeners are registered in pages/components via `useSocketEvents`.
- **`useSocketEvents`** (`src/hooks/useSocket.ts`): Registers/deregisters a map of `{ eventName: handler }` on mount/unmount. Every page that listens to socket events uses this hook.
- **`quizApi` / `uploadApi`** (`src/services/`): REST calls via `fetch`. Mockable independently of socket logic.
- **MSW** (`client/tests/mocks/`): Mock Service Worker handles REST API calls in frontend tests. Socket interactions are mocked directly.

### Game State Machine

```
LOBBY → QUESTION_INTRO → ANSWERING → REVEALING_ANSWER → LEADERBOARD
                                                              │
                                          ┌───────────────────┘
                                          ▼ (not last question)
                                     QUESTION_INTRO
                                          │ (last question)
                                          ▼
                                       GAME_OVER
```

State lives in `GameSession.state` on the server. The frontend stores mirror it locally after receiving socket events.

### Production Deployment

In `NODE_ENV=production`, Express statically serves `client/dist/` and catches all non-API routes with `index.html` (SPA fallback). Railway runs `npm run build` then `npm start`. The `VITE_SERVER_URL` env var must be set at build time so the client socket connects to the correct URL.

## Environment Variables

**Backend** (`server/.env`, copy from `server/.env.example`):
```
PORT=3001
NODE_ENV=development
UPLOAD_DIR=uploads
QUIZ_DATA_DIR=./data/quizzes
```

**Frontend** (`client/.env`): Only needed for cloud deployment:
```
VITE_SERVER_URL=https://your-app.railway.app
```
Local dev auto-detects the server IP via `GET /api/network`.
