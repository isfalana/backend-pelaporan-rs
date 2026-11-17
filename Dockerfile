# Menggunakan Node.js 22 Alpine
FROM node:22-alpine

# Direktori kerja
WORKDIR /app

# Salin manifest dependency
COPY package*.json ./

# Instal dependency
RUN npm ci

# Salin source code
COPY . .

# Port backend
EXPOSE 3000

# Jalankan server
CMD ["node", "index.js"]