
# Step 1: Build the application
FROM oven/bun:1.0.13-slim as base

WORKDIR /usr/app

FROM base AS install
ARG NODE_VERSION=20
ARG MONGODB_TOOLS_VERSION=debian10-x86_64-100.9.3
RUN apt update \
    && apt install -y curl
RUN curl -L https://raw.githubusercontent.com/tj/n/master/bin/n -o n \
    && bash n $NODE_VERSION \
    && rm n \
    && npm install -g n
RUN curl -L https://fastdl.mongodb.org/tools/db/mongodb-database-tools-${MONGODB_TOOLS_VERSION}.deb -o mongodb-database-tools.deb \
    && dpkg -i mongodb-database-tools.deb \
    && rm mongodb-database-tools.deb

COPY . .
RUN bun install --production
RUN bun run prisma generate

FROM base as release
COPY --from=install /usr/app/ .
COPY --from=install /usr/bin/mongodump /usr/bin/
ENV NODE_ENV production

EXPOSE 3000
ENTRYPOINT [ "bun", "run", "start" ]

