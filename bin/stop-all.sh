#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TOMEE_HOME="${TOMEE_HOME:-/Users/sibi/devTools/apache-tomee-plus-10.1.5}"
RUN_DIR="$ROOT_DIR/.run"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
BACKEND_PORT="${BACKEND_PORT:-8080}"
BACKEND_SCREEN_SESSION="${BACKEND_SCREEN_SESSION:-propertyconnect-tomee}"
FRONTEND_SCREEN_SESSION="${FRONTEND_SCREEN_SESSION:-propertyconnect-frontend}"

is_backend_port_listening() {
  lsof -nP -iTCP:"$BACKEND_PORT" -sTCP:LISTEN >/dev/null 2>&1
}

stop_backend_port_listener() {
  local attempt clear_checks port_pids pid
  clear_checks=0
  for attempt in 1 2 3 4 5; do
    if ! is_backend_port_listening; then
      clear_checks=$((clear_checks + 1))
      if [ "$clear_checks" -ge 3 ]; then
        echo "Backend port $BACKEND_PORT is not listening."
        return
      fi
      sleep 1
      continue
    fi

    clear_checks=0

    port_pids="$(lsof -tiTCP:"$BACKEND_PORT" -sTCP:LISTEN || true)"
    if [ -z "$port_pids" ]; then
      sleep 1
      continue
    fi

    echo "Stopping process(es) still listening on backend port $BACKEND_PORT: $port_pids"
    kill $port_pids || true
    sleep 2

    for pid in $port_pids; do
      if kill -0 "$pid" >/dev/null 2>&1; then
        echo "Force stopping backend port process $pid"
        kill -9 "$pid" || true
      fi
    done
    sleep 1
  done

  if is_backend_port_listening; then
    echo "Backend port $BACKEND_PORT is still in use after cleanup." >&2
    lsof -nP -iTCP:"$BACKEND_PORT" -sTCP:LISTEN >&2 || true
    exit 1
  fi

  echo "Backend port $BACKEND_PORT is not listening."
}

stop_frontend() {
  local pid_file="$RUN_DIR/propertyconnect-frontend.pid"
  local screen_file="$RUN_DIR/propertyconnect-frontend.screen"

  if command -v screen >/dev/null 2>&1; then
    local screen_session="$FRONTEND_SCREEN_SESSION"
    if [ -f "$screen_file" ]; then
      screen_session="$(cat "$screen_file")"
    fi
    screen -S "$screen_session" -X quit >/dev/null 2>&1 || true
    rm -f "$screen_file"
  fi

  if [ -f "$pid_file" ]; then
    local pid
    pid="$(cat "$pid_file")"
    if [ -n "$pid" ] && kill -0 "$pid" >/dev/null 2>&1; then
      echo "Stopping frontend process $pid..."
      kill "$pid" || true
    fi
    rm -f "$pid_file"
  fi

  if lsof -nP -iTCP:"$FRONTEND_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Stopping process listening on frontend port $FRONTEND_PORT..."
    lsof -tiTCP:"$FRONTEND_PORT" -sTCP:LISTEN | xargs kill || true
  else
    echo "Frontend port $FRONTEND_PORT is not listening."
  fi
}

echo "Using TomEE: $TOMEE_HOME"

stop_frontend

if command -v screen >/dev/null 2>&1; then
  screen -S "$BACKEND_SCREEN_SESSION" -X quit >/dev/null 2>&1 || true
  rm -f "$RUN_DIR/propertyconnect-tomee.screen"
fi

if [ -x "$TOMEE_HOME/bin/shutdown.sh" ]; then
  echo "Stopping TomEE..."
  (cd "$TOMEE_HOME" && ./bin/shutdown.sh) || true
else
  echo "Missing TomEE shutdown script: $TOMEE_HOME/bin/shutdown.sh" >&2
fi

sleep 3

TOMEE_PIDS="$(pgrep -f "catalina.base=$TOMEE_HOME" || true)"
if [ -n "$TOMEE_PIDS" ]; then
  echo "Stopping leftover TomEE process(es): $TOMEE_PIDS"
  kill $TOMEE_PIDS || true
  sleep 3
fi

TOMEE_PIDS="$(pgrep -f "catalina.base=$TOMEE_HOME" || true)"
if [ -n "$TOMEE_PIDS" ]; then
  echo "Force stopping leftover TomEE process(es): $TOMEE_PIDS"
  kill -9 $TOMEE_PIDS || true
fi

stop_backend_port_listener

echo "Stop command sent."
