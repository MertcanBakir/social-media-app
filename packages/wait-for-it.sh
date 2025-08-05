#!/bin/sh

HOST=$1
PORT=$2
TIMEOUT=${3:-30}

echo "⌛ Waiting $TIMEOUT seconds for $HOST:$PORT..."

start=$(date +%s)

while true; do
  nc -z "$HOST" "$PORT" && echo "✅ $HOST:$PORT is available" && exit 0

  now=$(date +%s)
  elapsed=$((now - start))

  if [ "$elapsed" -ge "$TIMEOUT" ]; then
    echo "❌ Timeout occurred after $TIMEOUT seconds waiting for $HOST:$PORT"
    exit 1
  fi

  sleep 1
done