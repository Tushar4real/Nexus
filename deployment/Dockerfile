FROM node:20-alpine

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./frontend/
WORKDIR /app/frontend
RUN npm ci --legacy-peer-deps

WORKDIR /app
COPY frontend ./frontend

ENV PORT=10000

EXPOSE 10000

WORKDIR /app/frontend
CMD ["sh", "-c", "npm run build && npm run preview -- --host 0.0.0.0 --port ${PORT}"]
