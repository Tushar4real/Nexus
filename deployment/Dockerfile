FROM node:20-alpine

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./frontend/
WORKDIR /app/frontend
RUN npm ci --legacy-peer-deps

WORKDIR /app
COPY frontend ./frontend
COPY deployment/render-start.sh ./deployment/render-start.sh

ENV PORT=10000
ENV NODE_ENV=production

EXPOSE 10000

RUN chmod +x /app/deployment/render-start.sh

CMD ["/app/deployment/render-start.sh"]
