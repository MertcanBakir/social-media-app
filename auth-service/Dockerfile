FROM node:20

# Sistem bağımlılıklarını yükle (netcat dahil)
RUN apt-get update && apt-get install -y netcat-openbsd

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
COPY wait-for-it.sh .
COPY ./docker-entrypoint.sh /app/docker-entrypoint.sh

RUN chmod +x wait-for-it.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 6000

ENTRYPOINT ["/app/docker-entrypoint.sh"]