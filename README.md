# PackThreads

PackThreads is a MERN stack web application where users open virtual graphic T-shirt packs, collect shirts of different rarities, save favorites, and view collection data. Admins can manage the shirt and pack data that powers the app.

## Project Overview

This project was built with the MERN stack:

- MongoDB
- Express.js
- React
- Node.js

The app currently includes:

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

- pull the latest version before starting work
- create their own local `.env` file
- avoid pushing secrets like database credentials
- commit often with clear messages
- communicate before editing the same files

## Quick Start

1. Create your server env file:

```bash
cp server/.env.example server/.env
```

If you do not have an example file, create `server/.env` manually with:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

2. Install dependencies:

```bash
npm install --prefix server
npm install --prefix client

3. Run seed:
npm run seed --prefix server

4. Start frontend + backend together:
```bash
./start-dev.sh
```

This starts:

- backend on port `5000`
- frontend on Vite default port (usually `5173`; if busy, Vite picks the next one)
- frontend bound to `0.0.0.0` so it is reachable from WSL network interfaces

## Folder Structure

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
