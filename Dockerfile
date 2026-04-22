FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV PORT=10000

EXPOSE 10000

CMD ["sh", "-c", "npm run build && npm run preview -- --host 0.0.0.0 --port ${PORT}"]
