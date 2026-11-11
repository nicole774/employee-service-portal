# Construction en deux étapes, comme au projet 1.

# Étape 1 : construire le site avec Node et Vite
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# L'adresse de l'API est écrite dans le code au moment du build (c'est comme ça
# que Vite gère les variables VITE_*). docker-compose la fournit en argument.
ARG VITE_API_URL=http://localhost:4000/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Étape 2 : servir le résultat avec nginx. L'image finale ne contient que dist/,
# ni Node ni les dépendances de build.
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
