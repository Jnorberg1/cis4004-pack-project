# PackThreads

PackThreads is a MERN stack web application where users open virtual graphic T-shirt packs, collect shirts of different rarities, save favorites, and view collection data. Users can propose trades with other collectors; admins manage the shirt and pack data that powers the app.

## Project Overview

Stack:

- MongoDB
- Express.js
- React (Vite)
- Node.js

Features:

- User registration and login (JWT)
- Admin and standard user roles
- Seeded sample data (`npm run seed --prefix server`)
- Virtual pack opening
- Collection entries and favorites
- Leaderboard and per-user leaderboard views
- User-to-user trading (create offers, accept, decline, cancel)
- Admin routes for shirt and pack management

## Team Notes

This repository is meant for collaborative development. Everyone on the team should:

- Pull the latest version before starting work
- Keep a local `server/.env` (never commit secrets)
- Commit often with clear messages
- Coordinate before editing the same files

## Quick Start

### 1. Environment

Create `server/.env` with:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Optional:

```env
PORT=5000
```

If the repo includes `server/.env.example`, you can copy it instead of creating the file by hand.

### 2. Install dependencies

```bash
npm install --prefix server
npm install --prefix client
```

### 3. Seed the database (optional)

With MongoDB reachable using `MONGO_URI`:

```bash
npm run seed --prefix server
```

### 4. Run the app

**Linux / macOS / Git Bash / WSL** — from the repo root:

```bash
./start-dev.sh
```

This starts the API with nodemon, runs the Vite dev server, and passes `--host 0.0.0.0` to the client so the UI is reachable from other interfaces (e.g. WSL networking).

**Windows (PowerShell or CMD)** — use two terminals from the repo root:

```bash
npm --prefix server run dev
```

```bash
npm --prefix client run dev
```

The client calls `http://localhost:5000/api` by default (`client/src/api/api.js`), so keep the server on port `5000` unless you change both.

**URLs**

- API: `http://localhost:5000` (root responds with a short status JSON)
- Frontend: Vite default `http://localhost:5173` (next port if that one is busy)

## API routes (summary)

| Prefix | Purpose |
|--------|---------|
| `/api/auth` | Register, login |
| `/api/packs` | Pack opening |
| `/api/collection` | Collection and favorites |
| `/api/leaderboard` | Leaderboard data |
| `/api/trades` | Create and manage trades |
| `/api/admin` | Admin shirt/pack management |

## Folder structure

```text
cis4004-pack-project/
  client/
    index.html
    vite.config.js
    eslint.config.js
    package.json
    public/
      favicon.svg
      icons.svg
    src/
      api/
        api.js
      assets/
        react.svg
        vite.svg
      components/
        Navbar.jsx
        ShirtImage.jsx
      pages/
        AdminDashboard.jsx
        CollectionPage.jsx
        HomePage.jsx
        LeaderboardPage.jsx
        LeaderboardUserPage.jsx
        LoginPage.jsx
        PacksPage.jsx
        RegisterPage.jsx
        TradingPage.jsx
      utils/
        sessionUiState.js
      App.css
      App.jsx
      index.css
      main.jsx
    README.md
  server/
    config/
      db.js
    controllers/
      authController.js
      collectionController.js
      packController.js
      tradeController.js
    middleware/
      adminMiddleware.js
      authMiddleware.js
    models/
      Category.js
      CollectionEntry.js
      index.js
      Pack.js
      PackOpeningHistory.js
      Rarity.js
      Shirt.js
      Trade.js
      User.js
    routes/
      adminRoutes.js
      authRoutes.js
      collectionRoutes.js
      leaderboardRoutes.js
      packRoutes.js
      tradeRoutes.js
    utils/
      blankTagRoll.js
    .gitignore
    package.json
    README.md
    seed.js
    server.js
  .gitignore
  README.md
  start-dev.sh
```
