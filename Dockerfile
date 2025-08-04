# --- 1. Aşama: Build ve bağımlılıkların kurulumu ---
FROM node:20-alpine AS builder

# Sistem bağımlılıkları
RUN apk add --no-cache netcat-openbsd

# Uygulama kök dizini
WORKDIR /app

# package.json ve lock dosyalarını kopyala
COPY package*.json ./

# Üretim bağımlılıklarını kur
RUN npm ci --omit=dev

# Geri kalan dosyaları kopyala
COPY . .

# Prisma generate işlemi dahilse burada yapılabilir
# npx prisma generate vs. gibi (isteğe bağlı)

# --- 2. Aşama: Hafif üretim imajı ---
FROM node:20-alpine

# Sistem bağımlılıkları
RUN apk add --no-cache netcat-openbsd

# Çalışma dizini
WORKDIR /app

# build aşamasından sadece gerekli dosyaları al
COPY --from=builder /app /app

# Script izinlerini ver
RUN chmod +x /app/packages/*.sh

# Gereksiz kullanıcıları silip güvenli kullanıcı oluştur
RUN addgroup -g 1001 -S nodejs && adduser -S appuser -u 1001
USER appuser

# Uygulama portu
EXPOSE 6000

# Başlatma komutu
ENTRYPOINT ["/app/packages/docker-entrypoint.sh"]