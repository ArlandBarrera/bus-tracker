FROM node:18-alpine

WORKDIR /app

COPY ./backend/package*.json ./

RUN npm install --production

COPY ./backend/. .

EXPOSE 3001

# -- development --
# CMD ["npm", "run", "dev"]

# -- production --
# health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["npm", "start"]
