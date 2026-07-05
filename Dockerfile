# imagem oficial do Node.js - alpine
FROM node:22-alpine

# diretório de trabalho dentro do container
WORKDIR /app

COPY package*.json ./

# Instala as dependências
RUN npm install

# copia aplicação
COPY . .

# porta
EXPOSE 3000


CMD ["npm", "start"]