# AI-Generated: Web container
# Generated-Date: 2026-10-26
# Description: Builds the React app from this folder and serves it behind nginx.

FROM node:22-bookworm-slim AS build
WORKDIR /web
COPY package.json package-lock.json ./
RUN npm ci
COPY . ./
RUN npm run build

FROM nginx:1.27-alpine
ENV API_UPSTREAM=http://api:8000
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /web/dist /usr/share/nginx/html
EXPOSE 80
