# Menggunakan base image Node.js versi 18 (Alpine untuk ukuran yang lebih ringan)
FROM node:18-alpine

# Menentukan direktori kerja di dalam container
WORKDIR /app

# Menyalin file package.json dan package-lock.json terlebih dahulu
COPY package*.json ./

# Menginstal dependency
RUN npm install

# Menyalin seluruh source code backend ke dalam container
COPY . .

# Membuka port 3000 sesuai dengan konfigurasi Express.js
EXPOSE 3000

# Menjalankan server menggunakan Node
CMD ["node", "index.js"]