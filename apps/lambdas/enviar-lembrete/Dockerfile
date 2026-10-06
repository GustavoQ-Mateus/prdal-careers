FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-slim AS local
WORKDIR /app
ENV NODE_ENV=production
RUN chown node:node /app
COPY --from=build /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
USER node
CMD ["node", "dist/servidor.js"]

FROM public.ecr.aws/lambda/nodejs:22 AS lambda
WORKDIR ${LAMBDA_TASK_ROOT}
COPY --from=local /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER 10001:10001
CMD ["dist/lembrete.handler"]
