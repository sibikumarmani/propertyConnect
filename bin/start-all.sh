#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TOMEE_HOME="${TOMEE_HOME:-/Users/sibi/devTools/apache-tomee-propertyconnect-10.0.1}"
FRONTEND_DIR="$ROOT_DIR/propertyconnect-frontend"
BACKEND_DIR="$ROOT_DIR/propertyconnect-backend"
RUN_DIR="$ROOT_DIR/.run"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
BACKEND_PORT="${BACKEND_PORT:-8081}"
CORECONNECT_PORT="${CORECONNECT_PORT:-8081}"
BACKEND_SCREEN_SESSION="${BACKEND_SCREEN_SESSION:-propertyconnect-tomee}"
FRONTEND_SCREEN_SESSION="${FRONTEND_SCREEN_SESSION:-propertyconnect-frontend}"

PROPERTYCONNECT_WAR="$BACKEND_DIR/target/propertyConnect.war"
CORECONNECT_WAR="$ROOT_DIR/coreConnect/target/coreConnect.war"
DEPLOY_CORECONNECT="${DEPLOY_CORECONNECT:-false}"
PROPERTYCONNECT_LOCAL_PROPERTIES="$BACKEND_DIR/local.properties"

mkdir -p "$RUN_DIR"

require_file() {
  if [ ! -e "$1" ]; then
    echo "Missing: $1" >&2
    exit 1
  fi
}

is_port_listening() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

stop_tomee_if_running() {
  if command -v screen >/dev/null 2>&1; then
    screen -S "$BACKEND_SCREEN_SESSION" -X quit >/dev/null 2>&1 || true
    rm -f "$RUN_DIR/propertyconnect-tomee.screen"
  fi

  if is_port_listening "$BACKEND_PORT"; then
    echo "Stopping existing PropertyConnect TomEE on port $BACKEND_PORT..."
    (cd "$TOMEE_HOME" && ./bin/shutdown.sh) || true
    sleep 3
  fi

  local tomee_pids
  tomee_pids="$(pgrep -f "catalina.base=$TOMEE_HOME" || true)"
  if [ -n "$tomee_pids" ]; then
    echo "Stopping leftover PropertyConnect TomEE process(es): $tomee_pids"
    kill $tomee_pids || true
    sleep 2
  fi

  tomee_pids="$(pgrep -f "catalina.base=$TOMEE_HOME" || true)"
  if [ -n "$tomee_pids" ]; then
    echo "Force stopping leftover PropertyConnect TomEE process(es): $tomee_pids"
    kill -9 $tomee_pids || true
  fi
}

echo "Using TomEE: $TOMEE_HOME"
require_file "$TOMEE_HOME/bin/startup.sh"
require_file "$TOMEE_HOME/bin/shutdown.sh"
require_file "$PROPERTYCONNECT_LOCAL_PROPERTIES"

echo "Building PropertyConnect backend WAR..."
(cd "$BACKEND_DIR" && mvn package)
require_file "$PROPERTYCONNECT_WAR"

stop_tomee_if_running

echo "Deploying PropertyConnect backend as propertyConnect.war..."
rm -rf "$TOMEE_HOME/webapps/propertyconnect-backend" \
       "$TOMEE_HOME/webapps/propertyconnect-backend.war" \
       "$TOMEE_HOME/webapps/propertyConnect" \
       "$TOMEE_HOME/webapps/propertyConnect.war"
cp "$PROPERTYCONNECT_WAR" "$TOMEE_HOME/webapps/propertyConnect.war"

if [ "$DEPLOY_CORECONNECT" = "true" ] && [ -f "$CORECONNECT_WAR" ]; then
  echo "Deploying CoreConnect WAR..."
  cp "$CORECONNECT_WAR" "$TOMEE_HOME/webapps/coreConnect.war"
elif [ "$DEPLOY_CORECONNECT" = "true" ]; then
  echo "CoreConnect WAR not found at $CORECONNECT_WAR; leaving existing TomEE deployment as-is."
else
  echo "Leaving existing CoreConnect deployment as-is. Set DEPLOY_CORECONNECT=true to redeploy it."
fi

echo "Starting TomEE on port $BACKEND_PORT..."
if command -v screen >/dev/null 2>&1; then
  screen -dmS "$BACKEND_SCREEN_SESSION" bash -lc "cd '$TOMEE_HOME' && export CATALINA_OPTS=\"\${CATALINA_OPTS:-} -Dpropertyconnect.local.properties=$PROPERTYCONNECT_LOCAL_PROPERTIES\" && ./bin/catalina.sh run"
  echo "$BACKEND_SCREEN_SESSION" > "$RUN_DIR/propertyconnect-tomee.screen"
else
  (
    cd "$TOMEE_HOME"
    export CATALINA_OPTS="${CATALINA_OPTS:-} -Dpropertyconnect.local.properties=$PROPERTYCONNECT_LOCAL_PROPERTIES"
    export USE_NOHUP=true
    ./bin/startup.sh
  )
fi

if is_port_listening "$FRONTEND_PORT"; then
  echo "Frontend port $FRONTEND_PORT is already listening; skipping frontend startup."
else
  echo "Starting PropertyConnect frontend on port $FRONTEND_PORT..."
  : > "$RUN_DIR/propertyconnect-frontend.log"
  if command -v screen >/dev/null 2>&1; then
    screen -S "$FRONTEND_SCREEN_SESSION" -X quit >/dev/null 2>&1 || true
    screen -dmS "$FRONTEND_SCREEN_SESSION" bash -lc "cd '$FRONTEND_DIR' && npm run dev > '$RUN_DIR/propertyconnect-frontend.log' 2>&1"
    echo "$FRONTEND_SCREEN_SESSION" > "$RUN_DIR/propertyconnect-frontend.screen"
  else
    (cd "$FRONTEND_DIR" && nohup npm run dev > "$RUN_DIR/propertyconnect-frontend.log" 2>&1 < /dev/null & echo $! > "$RUN_DIR/propertyconnect-frontend.pid")
  fi
fi

echo
echo "PropertyConnect frontend: http://localhost:$FRONTEND_PORT/propertyconnect/login"
echo "PropertyConnect backend:  http://localhost:$BACKEND_PORT/propertyConnect/api/health"
echo "CoreConnect ERP:          http://localhost:$CORECONNECT_PORT/coreConnect"
echo
echo "Frontend log: $RUN_DIR/propertyconnect-frontend.log"
