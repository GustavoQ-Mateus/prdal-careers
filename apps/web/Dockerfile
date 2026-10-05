FROM node:22-alpine AS build
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_API_VERSAO=v1
ENV VITE_API_VERSAO=$VITE_API_VERSAO
RUN apk add --no-cache git
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
ARG VITE_API_URL=http://localhost:3000
ENV PRDAL_API_ORIGIN=$VITE_API_URL
ENV PRDAL_HSTS=""
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
RUN sed -i '/^user /d; s|/var/run/nginx.pid|/tmp/nginx.pid|; s|/run/nginx.pid|/tmp/nginx.pid|' /etc/nginx/nginx.conf \
    && chown -R nginx:nginx /etc/nginx/conf.d /var/cache/nginx
USER nginx
EXPOSE 8080
