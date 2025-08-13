#!/bin/sh

SERVICE_NAME=$1
PORT=$2

# Kafka bekleme
/app/packages/wait-for-it.sh kafka 9092 30

# Postgres bekleme
echo "⏳ Waiting for Postgres..."
until nc -z postgres 5432; do
  sleep 1
done
echo "✅ Postgres is up."

# Redis bekleme
echo "⏳ Waiting for Redis..."
until nc -z redis 6379; do
  sleep 1
done
echo "✅ Redis is up."

# Servis dizinine geç
cd /app/apps/$SERVICE_NAME

# .env dosyasını yükle
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Prisma schema ayarları
SCHEMA_PATH=./prisma/schema.prisma

echo "🔄 Pushing DB schema for $SERVICE_NAME"
npx prisma db push --schema=$SCHEMA_PATH

echo "🔧 Generating Prisma Client for $SERVICE_NAME"
npx prisma generate --schema=$SCHEMA_PATH

export NODE_PATH=/app/node_modules

echo "🚀 Starting $SERVICE_NAME on port $PORT..."
PORT=$PORT npm start