# Même image que pour le projet 1 : Node.js 22 « slim » (Debian).
# Pas alpine : bcrypt utilise des binaires précompilés pour glibc, qu'alpine n'a pas.
FROM node:22-slim

WORKDIR /app

# OpenSSL est nécessaire au moteur Prisma et n'est pas inclus dans l'image slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# D'abord les dépendances : package*.json change rarement, donc Docker garde
# cette étape en cache et ne réinstalle pas tout à chaque modification du code
COPY package*.json ./
RUN npm ci

# Puis le code (schéma Prisma, migrations, seed, sources)
COPY . .

# Le client Prisma doit être généré ici : au moment du npm ci, le schéma
# n'avait pas encore été copié
RUN npx prisma generate

EXPOSE 4000

# Les migrations et le seed sont lancés par docker-compose avant ce démarrage
CMD ["npm", "start"]
