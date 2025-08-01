FROM node:20

# netcat (nc) için sistem güncellemesi ve kurulum
RUN apt-get update && apt-get install -y netcat-openbsd

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
COPY wait-for-it.sh .
COPY docker-entrypoint.sh .

RUN chmod +x wait-for-it.sh
RUN chmod +x docker-entrypoint.sh

EXPOSE 6003

ENTRYPOINT ["./docker-entrypoint.sh"]