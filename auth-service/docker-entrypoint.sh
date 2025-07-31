#!/bin/sh

# Kafka hazır olana kadar bekle (wait-for-it zaten bunu yapıyor)
./wait-for-it.sh kafka:9092 -t 30

# Wait for Postgres to be ready
echo "⏳ Waiting for Postgres..."
until nc -z postgres 5432; do
  sleep 1
done

echo "✅ Postgres is up. Running Prisma db push..."
npx prisma db push

echo "🚀 Starting app..."
npm start