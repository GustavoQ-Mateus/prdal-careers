FROM node:22-slim AS build
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_API_VERSAO=v1
ENV VITE_API_VERSAO=$VITE_API_VERSAO
WORKDIR /repo
COPY apps/web/package.json apps/web/package-lock.json ./apps/web/
WORKDIR /repo/apps/web
RUN npm ci
COPY packages/shared-types /repo/packages/shared-types
RUN npx tsc -p /repo/packages/shared-types/tsconfig.json
COPY apps/web ./
RUN npm run build

FROM nginx:1.27-alpine
ARG VITE_API_URL=http://localhost:3000
ENV PRDAL_API_ORIGIN=$VITE_API_URL
ENV PRDAL_HSTS=""
COPY apps/web/nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 80
