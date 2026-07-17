FROM node:22-alpine
RUN apk upgrade --no-cache
WORKDIR /app
COPY package.json .
RUN npm install --omit=dev \
 && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack /root/.npm
COPY server.js .
# Deployed image version surfaced by /api/status; CI passes the commit SHA.
ARG GIT_SHA=dev
ENV GIT_SHA=$GIT_SHA
EXPOSE 80
CMD ["node", "server.js"]
