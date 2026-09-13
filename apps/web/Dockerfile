FROM node:22-slim AS build
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL
WORKDIR /repo
COPY apps/web/package.json ./apps/web/package.json
WORKDIR /repo/apps/web
RUN npm install
COPY packages/shared-types /repo/packages/shared-types
RUN npx tsc -p /repo/packages/shared-types/tsconfig.json
COPY apps/web ./
RUN npm run build

FROM nginx:1.27-alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 80
