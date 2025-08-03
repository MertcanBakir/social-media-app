FROM node:20

# Sistem bağımlılıkları
RUN apt-get update && apt-get install -y netcat-openbsd

# Ana çalışma dizini
WORKDIR /app

# Tüm proje dosyalarını kopyala (package.json, turbo.json, apps, packages, vs.)
COPY . .

# Script izinlerini ver
RUN chmod +x /app/packages/wait-for-it.sh
RUN chmod +x /app/packages/docker-entrypoint.sh

# Workspace'lerdeki tüm bağımlılıkları kur
RUN npm install

ENV NODE_PATH=/app

# Uygulama portu
EXPOSE 6000

# Entrypoint olarak scripti belirle
ENTRYPOINT ["/app/packages/docker-entrypoint.sh"]