# 快問快答遊戲 Quick-Fire Quiz

類 Kahoot 的即時多人快問快答遊戲，專為教會聚會設計。出題者可透過網頁介面建立題庫，玩家掃描 QR Code 即可加入作答，系統依剩餘秒數即時計分並顯示排行榜。

## 功能特色

- **出題介面**：網頁式題庫設計，支援文字與圖片題目（題目及每個選項皆可上傳圖片），最多 256 題，可拖曳排序
- **即時遊戲**：Socket.io 驅動，毫秒級同步玩家作答狀態
- **QR Code 加入**：顯示畫面呈現大型 QR Code，玩家掃碼直接進入等候室
- **行動裝置顯示完整題目**：玩家作答畫面同步顯示題目文字、圖片與各選項內容，無需抬頭看大螢幕
- **倒數計時**：顯示畫面與玩家端右上角均有 SVG 圓環動畫，綠→黃→紅顏色提示剩餘時間
- **作答即時回饋**：玩家作答後停留在原畫面，所選選項高亮顯示（其他選項淡出），並出現「✓ 已作答」綠色標記
- **即時計分**：得分 = 答題時剩餘秒數（最低 1 分），伺服器端權威計算
- **延遲公佈結果**：答題結果於主持人按下「公佈答案」時才顯示；時限內未作答者自動判錯
- **排行榜**：每題結束後顯示前 5 名，第 1 名字體最大，依序遞減
- **頒獎典禮**：遊戲結束顯示金銀銅牌動畫
- **雙模式部署**：本地 WiFi 或 Railway 雲端

---

## 技術架構

### 後端 (Node.js)

```
Routes Layer      → 解析 HTTP 請求，呼叫 Service
Socket Layer      → 解析 Socket 事件，呼叫 Service，廣播結果
─────────────────────────────────────────────────────────
Service Layer     → 商業邏輯（QuizService, GameService）
─────────────────────────────────────────────────────────
Repository Layer  → 資料存取（QuizRepository — JSON 檔案）
─────────────────────────────────────────────────────────
Domain/Utils      → 純函式（計分、遊戲代碼產生、狀態機）
```

| 套件 | 用途 |
|------|------|
| Express 4 | HTTP 伺服器、REST API |
| Socket.io 4 | 即時雙向通訊 |
| multer | 圖片上傳（最大 5MB，jpeg/png/gif/webp）|
| uuid | 唯一 ID 產生 |

### 前端 (React)

```
Pages             → 路由進入點（HomePage, DesignPage, HostPage, DisplayPage, PlayerPage）
Components        → UI 元件（display/, player/, design/, shared/）
─────────────────────────────────────────────────────────
Hooks / Store     → Zustand 狀態管理、自訂 Hooks
─────────────────────────────────────────────────────────
Services          → API 呼叫、Socket 通訊（可獨立 mock）
```

| 套件 | 用途 |
|------|------|
| React 18 + Vite 6 | 前端框架與建構工具 |
| TypeScript | 型別安全 |
| Tailwind CSS v4 | 樣式 |
| Zustand 5 | 狀態管理 |
| Framer Motion 11 | 動畫（排行榜滑入、頒獎彈跳）|
| qrcode.react 4 | QR Code 產生 |
| React Router 6 | 前端路由 |
| @dnd-kit | 題目拖曳排序 |

---

## 遊戲狀態機

```
LOBBY → QUESTION_INTRO → ANSWERING → REVEALING_ANSWER → LEADERBOARD
                                                              │
                                          ┌───────────────────┘
                                          ▼ (非最後題)
                                     QUESTION_INTRO
                                          │ (最後題)
                                          ▼
                                       GAME_OVER
```

| 狀態 | 顯示畫面 | 主持人畫面 | 玩家畫面 |
|------|----------|------------|----------|
| LOBBY | QR Code + 遊戲名稱 | 玩家列表 + 開始按鈕 | 輸入暱稱表單 |
| QUESTION_INTRO | 題目淡入（無計時）| 題目預覽 | 「準備中...」 |
| ANSWERING | 題目 + 右上角倒數圓環 | 已答人數進度 | A/B/C/D 色塊按鈕 + 右上角倒數圓環；作答後高亮所選選項並顯示「✓ 已作答」 |
| REVEALING_ANSWER | 正確答案高亮 | 顯示排行榜按鈕 | 答對/錯 + 得分 |
| LEADERBOARD | 前 5 名縮放排行 | 下一題 / 結束 | 個人排名 |
| GAME_OVER | 金銀銅牌 + 前 5 名 | 回首頁 | 最終名次 |

---

## 快速開始

### 前置需求

- Node.js 18+
- npm 9+

### 安裝

```bash
git clone <repo-url>
cd Bible_Test

# 安裝根層依賴
npm install

# 安裝後端依賴
cd server && npm install && cd ..

# 安裝前端依賴
cd client && npm install && cd ..
```

### 本地開發

```bash
npm run dev
# 後端啟動於 http://localhost:3001
# 前端等後端就緒後啟動於 http://localhost:5173
```

### 遊戲流程

1. 開啟 `http://localhost:5173` → 建立題庫並新增題目
2. 對某題庫點擊「開始遊戲」→ 進入主持人控制台（`/host/GAMECODE`）
3. 在另一個視窗開啟顯示畫面（`/display/GAMECODE`）→ 大螢幕顯示 QR Code
4. 玩家掃描 QR Code 或前往 `/play/GAMECODE` → 輸入暱稱加入
5. 主持人按「開始遊戲」→ 題目開始依序出現
6. 每題作答結束後，主持人按「顯示排行榜」→ 前 5 名滑入
7. 全部題目結束 → 顯示畫面呈現金銀銅牌頒獎

---

## 路由說明

| 路由 | 說明 |
|------|------|
| `/` | 首頁：瀏覽題庫、建立新題庫、開始遊戲 |
| `/design/:quizId` | 題庫編輯：出題、上傳圖片、拖曳排序 |
| `/host/:gameCode` | 主持人控制台（即時狀態、控制流程）|
| `/display/:gameCode` | 顯示畫面（投影到大螢幕）|
| `/play` | 玩家加入頁（輸入遊戲代碼）|
| `/play/:gameCode` | 玩家加入頁（掃碼後直接帶入代碼）|

---

## REST API

| 方法 | 路由 | 說明 |
|------|------|------|
| GET | `/api/quizzes` | 列出所有題庫 |
| POST | `/api/quizzes` | 建立題庫 |
| GET | `/api/quizzes/:id` | 取得完整題庫 |
| PUT | `/api/quizzes/:id` | 更新題庫 |
| DELETE | `/api/quizzes/:id` | 刪除題庫 |
| POST | `/api/quizzes/:id/questions` | 新增題目 |
| PUT | `/api/quizzes/:id/questions/:idx` | 更新題目 |
| DELETE | `/api/quizzes/:id/questions/:idx` | 刪除題目 |
| POST | `/api/quizzes/:id/questions/reorder` | 重新排序 |
| POST | `/api/upload` | 上傳圖片（multipart, field: `image`，最大 5MB）|
| DELETE | `/api/upload/:filename` | 刪除已上傳圖片 |
| GET | `/api/network` | 取得本機 IP（QR Code 用）|

---

## 測試

```bash
# 執行所有測試（後端 + 前端）
npm run test:all

# 單獨執行後端測試
npm run test:server

# 單獨執行前端測試
npm run test:client

# 覆蓋率報告（生成至 server/coverage/ 和 client/coverage/）
npm run test:coverage:all

# E2E 測試（需先啟動 npm run dev）
npm run test:e2e
```

### 測試覆蓋率

| 範圍 | 測試數 | Statements | Branches | Functions | Lines |
|------|--------|------------|----------|-----------|-------|
| 後端 | 118 | 93.96% | 83.41% | 95.29% | 96.86% |
| 前端 | 200 | 94.84% | 91.47% | 81.66% | 94.84% |

### 測試分層

**後端**
- `server/tests/unit/` — utils、models、services 純單元測試
- `server/tests/integration/api/` — REST API（Supertest）
- `server/tests/integration/socket/` — Socket.io 完整遊戲流程

**前端**
- `client/tests/unit/` — stores、hooks、services 單元測試（Vitest）
- `client/tests/integration/` — 元件與頁面整合測試（@testing-library/react + msw）
- `client/tests/e2e/` — 端對端測試（Playwright）

---

## 目錄結構

```
Bible_Test/
├── package.json              # 根層腳本（dev / build / test）
├── railway.json              # Railway 部署設定
├── .gitignore
│
├── server/                   # Node.js 後端
│   ├── src/
│   │   ├── index.js          # 伺服器入口
│   │   ├── app.js            # Express 設定
│   │   ├── routes/           # HTTP 路由層
│   │   ├── socket/           # Socket.io 事件層
│   │   ├── services/         # 商業邏輯層
│   │   ├── repositories/     # 資料存取層
│   │   ├── models/           # 領域模型（GameSession 狀態機）
│   │   ├── middleware/        # multer 上傳中介軟體
│   │   └── utils/            # 純函式（計分、遊戲代碼、網路資訊）
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── fixtures/
│   └── data/quizzes/         # 題庫 JSON 儲存目錄
│
└── client/                   # React 前端
    ├── src/
    │   ├── pages/            # 5 個頁面元件
    │   ├── components/       # display/ player/ design/ shared/
    │   ├── store/            # Zustand 狀態（quiz/host/player/display）
    │   ├── hooks/            # useCountdown, useNetworkInfo, useSocket
    │   ├── services/         # quizApi, socketService, uploadApi
    │   └── types/            # TypeScript 型別定義
    └── tests/
        ├── unit/
        ├── integration/
        ├── e2e/              # Playwright E2E 測試
        └── mocks/            # msw Mock Service Worker handlers
```

---

## 環境變數

### 後端（`server/.env`）

```env
PORT=3001                        # 伺服器埠號（預設 3001）
QUIZ_DATA_DIR=./data/quizzes     # 題庫 JSON 儲存路徑
UPLOAD_DIR=./uploads             # 圖片上傳儲存路徑
```

### 前端（`client/.env`）

```env
VITE_SERVER_URL=https://your-app.railway.app   # 雲端部署時的伺服器 URL
                                                # 本地開發無需設定（自動偵測 IP）
```

---

## 雲端部署（Railway）

1. 在 Railway 建立新專案，連結此 Git repository
2. 設定環境變數：
   - `NODE_ENV=production`
   - `PORT=3001`
   - `VITE_SERVER_URL=https://<your-app>.railway.app`
   - `UPLOAD_DIR=/data/uploads`（掛載 Persistent Volume 至 `/data/uploads`）
3. Railway 自動執行 `npm run build` 後以 `npm start` 啟動
4. 前端 `client/dist/` 由 Express 靜態服務一併提供

---

## 計分公式

```
得分 = ⌈剩餘秒數⌉，最低 1 分
```

- 答題時間越快，得分越高
- 計時由**伺服器端**計算（`questionEndTime - Date.now()`），不採用客戶端時間，防止作弊

---

## 授權

MIT License
