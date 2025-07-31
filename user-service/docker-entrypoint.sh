#!/bin/sh

# Kafka hazır olana kadar bekle (wait-for-it zaten bunu yapıyor)
./wait-for-it.sh kafka:9092 -t 30

# Postgres hazır olana kadar bekle
echo "⏳ Waiting for Postgres..."
until nc -z postgres 5432; do
  sleep 1
done
echo "✅ Postgres is up."

# Prisma ile veritabanını senkronize et
echo "🔄 Running prisma db push..."
npx prisma db push

# Uygulamayı başlat
echo "🚀 Starting user-service..."
npm start