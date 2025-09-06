FROM node:22.16.0-alpine AS base

WORKDIR /usr/src/app

# Install OS deps if needed (none for now)

# Only copy package manifests first for better layer caching
COPY package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

# Copy source
COPY . ./

# Expose app port
EXPOSE 3535

# Environment defaults (can be overridden by compose or env file)
ENV NODE_ENV=stage \
    PORT=3535

CMD ["node", "app.js"]

