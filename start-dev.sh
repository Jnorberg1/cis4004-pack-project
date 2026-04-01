#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

SERVER_PID=""
CLIENT_PID=""

cleanup() {
  if [[ -n "$SERVER_PID" ]]; then
    kill "$SERVER_PID" 2>/dev/null || true
  fi
  if [[ -n "$CLIENT_PID" ]]; then
    kill "$CLIENT_PID" 2>/dev/null || true
  fi
}

trap cleanup INT TERM EXIT

echo "Starting backend..."
npm --prefix server run dev &
SERVER_PID=$!

echo "Starting frontend (WSL-exposed)..."
npm --prefix client run dev -- --host 0.0.0.0 &
CLIENT_PID=$!

wait -n "$SERVER_PID" "$CLIENT_PID"
echo "One service exited. Stopping the other..."
exit 1
