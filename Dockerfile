
# Step 1: Build the application
FROM oven/bun:1.0.12-slim as base

WORKDIR /usr/app

FROM base AS install
ARG NODE_VERSION=20
RUN apt update \
    && apt install -y curl
RUN curl -L https://raw.githubusercontent.com/tj/n/master/bin/n -o n \
    && bash n $NODE_VERSION \
    && rm n \
    && npm install -g n

COPY . .
RUN bun install --production
RUN bun run prisma generate

FROM base as release
COPY --from=install /usr/app/ .

ENV NODE_ENV production
USER bun

EXPOSE 3000
ENTRYPOINT [ "bun", "run", "start" ]

