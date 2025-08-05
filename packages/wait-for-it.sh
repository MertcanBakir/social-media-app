#!/bin/sh

HOST=$1
PORT=$2
TIMEOUT=${3:-30}

echo "⌛ Waiting $TIMEOUT seconds for $HOST:$PORT..."

end=$((SECONDS + TIMEOUT))

while [ $SECONDS -lt $end ]; do
  nc -z "$HOST" "$PORT" && echo "✅ $HOST:$PORT is available" && exit 0
  sleep 1
done

echo "❌ Timeout occurred after $TIMEOUT seconds waiting for $HOST:$PORT"
exit 1