FROM node:22-slim AS build
WORKDIR /app
COPY apps/lambdas/enviar-lembrete/package.json apps/lambdas/enviar-lembrete/package-lock.json ./
RUN npm ci
COPY apps/lambdas/enviar-lembrete/tsconfig.json ./
COPY apps/lambdas/enviar-lembrete/src ./src
RUN npm run build

FROM node:22-slim AS local
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
CMD ["node", "dist/servidor.js"]

FROM public.ecr.aws/lambda/nodejs:22 AS lambda
WORKDIR ${LAMBDA_TASK_ROOT}
COPY --from=local /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
CMD ["dist/lembrete.handler"]
