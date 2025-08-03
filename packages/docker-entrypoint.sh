#!/bin/sh

SERVICE_NAME=$1
PORT=$2

/app/packages/wait-for-it.sh kafka:9092 -t 30

echo "⏳ Waiting for Postgres..."
until nc -z postgres 5432; do
  sleep 1
done
echo "✅ Postgres is up."

cd /app/apps/$SERVICE_NAME

if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

SCHEMA_PATH=./prisma/schema.prisma

echo "🔄 Pushing DB schema for $SERVICE_NAME"
npx prisma db push --schema=$SCHEMA_PATH

echo "🔧 Generating Prisma Client for $SERVICE_NAME"
npx prisma generate --schema=$SCHEMA_PATH

export NODE_PATH=/app/node_modules

echo "🚀 Starting $SERVICE_NAME on port $PORT..."
PORT=$PORT npm start