# PackThreads

PackThreads is a MERN stack web application where users open virtual graphic T-shirt packs, collect shirts of different rarities, save favorites, and view collection data. Admins can manage the shirt and pack data that powers the app.

## Project Overview

This project was built with the MERN stack:

- MongoDB
- Express.js
- React
- Node.js

The app currently includes:

- user registration
- user login with JWT authentication
- admin and standard user roles
- seeded sample data
- virtual pack opening
- saved collection entries
- favorites system
- leaderboard foundation
- admin routes for shirt and pack management

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
```

3. Start frontend + backend together:

```bash
./start-dev.sh
```

This starts:

- backend on port `5000`
- frontend on Vite default port (usually `5173`; if busy, Vite picks the next one)
- frontend bound to `0.0.0.0` so it is reachable from WSL network interfaces

## Folder Structure

```text
packthreads/
  client/
    src/
      api/
      components/
      pages/
      App.jsx
      main.jsx
    package.json
  server/
    config/
    controllers/
    middleware/
    models/
    routes/
    .env
    seed.js
    server.js
    package.json
  .gitignore
  README.md
