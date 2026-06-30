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
- **`QuizService`** (`src/services/QuizService.js`): Quiz CRUD business logic. Question validation: must have text or imageUrl, exactly 4 options, `correctIndex` 0–3, `timeLimit` from the allowed set. `createQuiz` initialises `lobbyImageUrl: null` and `defaultTimeLimit: 10`; `updateQuiz` accepts `lobbyImageUrl` (string or null) to set the waiting-screen image. `duplicateQuiz(id)` deep-copies the quiz with new UUIDs and appends `(複製)` to the title.
- **`GameService`** (`src/services/GameService.js`): Owns the game loop — `createSession`, `startQuestion`, `beginAnswering`, `revealAnswer`, `showLeaderboard`, `nextQuestion`, `endGame`, `removeSession`, `getByCode`, `getById`. Stores all active sessions in a module-level `Map` (in-memory, lost on restart). `startQuestion` immediately calls `beginAnswering` synchronously, so `QUESTION_INTRO` is a transient state. `endGame` sets `session.state` directly instead of calling `transition()` — intentional escape hatch callable from any state.
- **`GameSession`** (`src/models/GameSession.js`): The state machine. Enforces valid transitions via `VALID_TRANSITIONS`. Scoring is server-authoritative: `Math.max(1, Math.ceil((questionEndTime - Date.now()) / 1000))`, minimum 1 point.
- **`QuizRepository`**: Reads/writes quiz JSON files from `server/data/quizzes/` (one file per quiz, named `{uuid}.json`).

### Socket Room Naming

Every socket joins rooms to scope broadcasts:

| Room | Members |
|------|---------|
| `game:GAMECODE` | All players + host |
| `host:GAMECODE` | Host only |
| `display:GAMECODE` | Display screen only |

Events are prefixed by receiver: `host:*`, `player:*`, `display:*`.

### Socket Event Contract

**Client → Server (emits):**

| Event | Payload | Handler |
|-------|---------|---------|
| `host:create_game` | `{ quizId }` | Creates session, host joins rooms |
| `host:create_game_join` | `{ gameCode }` | Reconnects host to existing session (bypasses creation) |
| `host:start_game` | `{ gameCode }` | Transitions LOBBY → QUESTION_INTRO |
| `host:reveal_answer` | `{ gameCode }` | Clears timer, transitions ANSWERING → REVEALING_ANSWER |
| `host:show_leaderboard` | `{ gameCode }` | Transitions REVEALING_ANSWER → LEADERBOARD |
| `host:next_question` | `{ gameCode }` | Calls nextQuestion (→ QUESTION_INTRO or GAME_OVER) |
| `host:end_game` | `{ gameCode }` | Forces GAME_OVER from any state |
| `player:join` | `{ gameCode, nickname }` | Adds player, must be in LOBBY |
| `player:submit_answer` | `{ gameCode, answerIndex, clientTimestamp }` | Records answer (only accepted in ANSWERING state; `clientTimestamp` is sent but not used server-side) |
| `display:register` | `{ gameCode }` | Joins display room; catches up to current state |

**Server → Client (listeners):**

| Event | Recipient | Payload summary |
|-------|-----------|-----------------|
| `host:game_created` | host | `{ gameCode, quizTitle, totalQuestions }` |
| `host:player_joined` | host | `{ player, playerCount }` |
| `host:player_left` | host | `{ playerId, playerCount }` |
| `host:answer_progress` | host | `{ answered, total }` |
| `host:question_timeout` | host | `{ questionIndex }` — emitted by `revealAnswer()` in both timer-expiry and manual-reveal cases |
| `host:error` | host | `{ message }` |
| `player:join_success` | player | `{ playerId, nickname, gameCode, quizTitle, lobbyImageUrl }` |
| `player:join_error` | player | `{ code, message }` — codes: `GAME_NOT_FOUND`, `GAME_STARTED`, `NICKNAME_TAKEN`, `FULL` |
| `player:question_ready` | all in game | `{ questionIndex, totalQuestions, timeLimit, question: { text, imageUrl, options } }` |
| `player:answering_start` | all in game | `{}` |
| `player:answer_accepted` | player | `{}` |
| `player:answer_result` | player | `{ correct, score, totalScore, rank }` |
| `player:leaderboard` | player | `{ myRank, myScore, top5 }` |
| `player:game_over` | player | `{ finalRank, finalScore, top5 }` |
| `display:waiting_room` | display | `{ gameCode, quizTitle, playerCount }` |
| `display:player_count` | display | `{ count, latestNickname }` |
| `display:question_start` | display + host | `{ questionIndex, totalQuestions, question, timeLimit }` |
| `display:time_update` | display | `{ timeRemaining }` — emitted every 500ms |
| `display:reveal_answer` | display | `{ correctIndex, counts }` |
| `display:leaderboard` | display + host | `{ scores }` |
| `display:game_over` | display + host | `{ scores }` |

**Display reconnection catch-up**: When `display:register` fires mid-game, `displayHandlers.js` immediately replays the appropriate event for the current state (`display:question_start` for QUESTION_INTRO/ANSWERING/REVEALING_ANSWER, `display:reveal_answer` additionally for REVEALING_ANSWER, `display:leaderboard` for LEADERBOARD, `display:game_over` for GAME_OVER). The timer does not replay — the display will miss elapsed time.

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

### Per-State UI by Role

| State | Display screen | Host | Player |
|-------|---------------|------|--------|
| LOBBY | QR Code + quiz title | Player list + Start button | Nickname entry form → after joining: WaitingLobby (shows `lobbyImageUrl` if set, otherwise ✝️ emoji) |
| QUESTION_INTRO | Question text fades in (no timer) | Question preview | "Preparing…" |
| ANSWERING | Question + SVG countdown ring (top-right, green→yellow→red) | Answered count progress | A/B/C/D color-block buttons + countdown ring (top-right, size=72); after answering, stays on same screen with selected option highlighted and "✓ 已作答" badge — no separate waiting screen |
| REVEALING_ANSWER | Correct option highlighted + per-option bar chart | Show Leaderboard button | Correct/wrong + points earned |
| LEADERBOARD | Top-5 slide-in with scaled font sizes | Next Question / End Game | Personal rank |
| GAME_OVER | Gold/silver/bronze medal animation + top-5 | Back to home | Final rank + score |

### Frontend (`client/`)

React 18 + TypeScript + Vite. Key dependencies: **Tailwind CSS v4** (uses CSS `@import` / `@theme` syntax, not the v3 `tailwind.config.js`), **Zustand 5**, **Framer Motion 11** (leaderboard slide-in, medal bounce), **@dnd-kit** (question reorder in DesignPage), **qrcode.react 4**.

Routes and their corresponding pages:

| URL | Page | Role |
|-----|------|------|
| `/` | `HomePage` | Quiz list — create, rename (click title to inline-edit), duplicate, delete, start game |
| `/design`, `/design/:quizId` | `DesignPage` | Create/edit quizzes; sidebar has `ImageUploader` for `lobbyImageUrl` (waiting-screen image) |
| `/host/:gameCode` | `HostPage` | Host controls during a game |
| `/display/:gameCode` | `DisplayPage` | Projector/audience display |
| `/play`, `/play/:gameCode` | `PlayerPage` | Player join and game flow |

- **Stores** (`src/store/`): `quizStore`, `hostStore`, `playerStore`, `displayStore` — one per role. Stores hold derived UI state only; the source of truth is the server.
- **`PlayerState`** (`src/types/game.ts`): Defines 7 values (`JOIN`, `WAITING`, `QUESTION_READY`, `ANSWERING`, `ANSWERED`, `RESULT`, `LEADERBOARD`, `GAME_OVER`). `QUESTION_READY` is defined in the type but never set in practice — `setQuestionReady()` in `playerStore` transitions directly to `ANSWERING`. Actual flow: `JOIN → WAITING → ANSWERING → ANSWERED → RESULT → LEADERBOARD / GAME_OVER`. `PlayerPage` renders `AnswerPad` for both `ANSWERING` and `ANSWERED` states (no separate waiting screen); a `key={questionIndex}` prop ensures the component remounts fresh on each new question. `playerStore` holds `lobbyImageUrl: string | null` (received from `player:join_success`), passed to `WaitingLobby`.
- **`socketService`** (`src/services/socketService.ts`): Single thin wrapper around the shared `socket.ts` singleton. All socket emits go through here; all socket listeners are registered in pages/components via `useSocketEvents`. Before connecting, sets `socket.auth = { role, gameCode }`.
- **`socket.ts`**: Created with `autoConnect: false` — must call `socketService.connect(role, gameCode)` before any events fire.
- **`useSocketEvents`** (`src/hooks/useSocket.ts`): Registers/deregisters a map of `{ eventName: handler }` on mount/unmount. Has **no dependency array**, so it re-registers handlers on every render. Pass stable handler references (via `useCallback` or store methods) to avoid stale closures.
- **`quizApi` / `uploadApi`** (`src/services/`): REST calls via `fetch`. Mockable independently of socket logic.
- **MSW** (`client/tests/mocks/`): Mock Service Worker handles REST API calls in frontend tests. Socket interactions are mocked directly.

### REST API

All endpoints under `/api/`:

- `GET /api/quizzes` — list all quizzes
- `POST /api/quizzes` — create quiz (`{ title, description?, defaultTimeLimit? }`); `defaultTimeLimit` defaults to 10
- `GET /api/quizzes/:id` — get quiz by id
- `PUT /api/quizzes/:id` — update quiz metadata (title, description, defaultTimeLimit, lobbyImageUrl)
- `DELETE /api/quizzes/:id` — delete quiz
- `POST /api/quizzes/:id/duplicate` — duplicate quiz (new UUIDs, title appended with `(複製)`)
- `POST /api/quizzes/:id/questions` — add question
- `PUT /api/quizzes/:id/questions/:idx` — update question by index
- `DELETE /api/quizzes/:id/questions/:idx` — delete question by index
- `POST /api/quizzes/:id/questions/reorder` — reorder (`{ fromIndex, toIndex }`)
- `POST /api/upload` — upload image (multipart, field name `image`, max 5 MB, jpeg/png/gif/webp); returns `{ url }`
- `DELETE /api/upload/:filename` — delete uploaded image file
- `GET /api/network` — returns local IP for client auto-detection in dev

### Domain Constraints

- **Players per game**: max 100 (enforced in `GameSession.addPlayer`)
- **Questions per quiz**: max 256 (enforced in `QuizService.addQuestion`)
- **Valid time limits**: `[5, 10, 15, 20, 30, 45, 60]` seconds (validated in `QuizService`)
- **Scoring**: `Math.max(1, Math.ceil((questionEndTime - Date.now()) / 1000))` — time-based, minimum 1 point for a correct answer
- **Leaderboard**: always returns top 5 with tied-rank grouping; each entry is `{ rank, score, nicknames[], total }`

### Test Organization

Backend (`server/tests/`):
- `unit/` — models, services, utils, repositories (isolated, no I/O)
- `integration/api/` — HTTP route tests using supertest
- `integration/socket/` — Socket.IO flow tests

Frontend (`client/tests/`):
- `unit/` — stores, hooks, services (no DOM)
- `integration/` — component and page render tests with React Testing Library + MSW
- `e2e/` — Playwright tests (require `npm run dev` running)

Backend coverage thresholds enforced by Jest: 80% branches, 85% functions/lines/statements. Frontend thresholds enforced by Vitest: 75% branches, 80% functions/lines/statements. Current counts: 140 backend tests, 227 frontend tests.

### Production Deployment

In `NODE_ENV=production`, Express statically serves `client/dist/` and catches all non-API routes with `index.html` (SPA fallback). Railway runs `npm install` (which triggers `postinstall` to install `server/` and `client/` dependencies), then `npm run build`, then `npm start`.

`VITE_SERVER_URL` is **not required** for Railway — the socket connects to the same origin (`io('')`), and `DisplayPage` derives the QR code join URL from `window.location.origin` in non-dev environments. Only set `VITE_SERVER_URL` if the frontend and backend are on different domains.

Required Railway env vars: `NODE_ENV=production`, `UPLOAD_DIR=/data/uploads`, `QUIZ_DATA_DIR=/data/quizzes`. A Persistent Volume mounted at `/data` is needed to survive redeployments.

Two one-shot migration scripts exist at repo root (`migrate-quizzes.js`, `migrate-images.js`) for copying local quiz data and uploaded images to a Railway instance.

## Environment Variables

**Backend** (`server/.env`, copy from `server/.env.example`):
```
PORT=3001
NODE_ENV=development
UPLOAD_DIR=uploads
QUIZ_DATA_DIR=./data/quizzes
```

**Frontend** (`client/.env`): Only needed when frontend and backend are on **different** domains:
```
VITE_SERVER_URL=https://your-backend.railway.app
```
Local dev auto-detects the server IP via `GET /api/network`. Railway single-service deployments do not need this variable.
