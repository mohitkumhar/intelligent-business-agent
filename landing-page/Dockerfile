# Omit explicit # syntax=... so Docker does not pull docker/dockerfile from Hub (breaks behind TLS-inspecting proxies).
FROM node:20-alpine

WORKDIR /app

# Corporate proxies / TLS inspection: pass --build-arg NPM_CONFIG_STRICT_SSL=false if npm fails TLS
ARG NPM_CONFIG_STRICT_SSL=true
ENV NPM_CONFIG_STRICT_SSL=${NPM_CONFIG_STRICT_SSL}

COPY package*.json ./

# Flaky / slow networks: npm often hits ECONNRESET during long installs
RUN npm config set fetch-retries 10 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 120000

# Cache registry tarballs between builds (requires Docker BuildKit)
RUN --mount=type=cache,target=/root/.npm \
  npm ci --legacy-peer-deps --no-audit --no-fund

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh && chmod +x /usr/local/bin/docker-entrypoint.sh

COPY . .

# Expose the port defined in package.json (dev script uses port 3003)
EXPOSE 5173

ENTRYPOINT ["docker-entrypoint.sh"]
# Run the dev server and bind to 0.0.0.0
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0","--port", "5173"]
