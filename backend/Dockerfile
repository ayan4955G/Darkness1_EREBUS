FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY app.js migrate.js ./
COPY migrations ./migrations
COPY services ./services
ENV NODE_ENV=production
EXPOSE 1000
CMD ["node", "app.js"]
