## Builder stage: use Debian image so we can install build tools required by
## native modules (better-sqlite3, etc.). Install Python and build-essential
## only during build, then discard them in the final runtime image.
FROM node:18-bullseye AS builder

WORKDIR /usr/src/app

# Copy package manifests first to leverage Docker layer caching
COPY package*.json ./

# Install system build deps needed by node-gyp / native modules, then
# install node dependencies. We remove apt lists afterwards to keep the
# layer small.
RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
		python3 \
		build-essential \
		pkg-config \
		libsqlite3-dev \
	&& npm ci --unsafe-perm \
	&& rm -rf /var/lib/apt/lists/*

# Copy the rest of the source and build the app
COPY . .
RUN npm run build

## Runtime stage: lightweight image with only what is needed to run
FROM node:18-bullseye-slim

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Copy built app and node_modules from builder
COPY --from=builder /usr/src/app .

EXPOSE 3000

CMD [ "npm", "start" ]
