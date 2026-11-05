# Production image only: development goes through docker-compose.dev.yml.
#
# Only the last stage is shipped. The "-dev" images contain a shell, npm and run as root,
# which is why they are limited to the intermediate stages.
#
# Every stage uses the same Alpine release so that native modules match the runtime libc.


# Compile TypeScript to JavaScript
FROM dhi.io/node:24-alpine3.23-dev@sha256:bef23378636b0574fc7048f6a5bf10ab89a5ddf853011c593cb33c092ad41dd3 AS builder
WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
COPY src ./src

# Install scripts are ignored to prevent a compromised package from running code during the build
RUN npm ci --ignore-scripts
RUN npm run build


# Install the production dependencies separately, because the runtime image does not contain npm
FROM dhi.io/node:24-alpine3.23-dev@sha256:bef23378636b0574fc7048f6a5bf10ab89a5ddf853011c593cb33c092ad41dd3 AS production-dependencies
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts


# Final image: no shell, no package manager
FROM dhi.io/node:24-alpine3.23@sha256:ea44fbd46a8e11a9ffb9b2bd5c6e4722fa507fb86fef0ee8d92a020ce7c850a5 AS runner
WORKDIR /app

ENV NODE_ENV=production

# Files stay owned by root so that the runtime user cannot modify the application
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY public ./public

# Dedicated UID that matches no account on the host, unlike the default UID 1000 of the base image
USER 1800:1800

# Documentation only: nothing is published, the port is reached through the Docker network
EXPOSE 80

CMD ["node", "dist/server.js"]
