FROM node:24-alpine
WORKDIR /app
COPY server ./server
COPY drizzle ./drizzle
RUN mkdir /data && chown node:node /data
USER node
ENV DATABASE_PATH=/data/fleetops.sqlite
ENV PORT=3001
EXPOSE 3001
CMD ["node", "server/node.mjs"]
