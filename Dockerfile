# imagem oficial do Node.js - alpine
FROM node:22-alpine

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia apenas os arquivos de dependências primeiro 
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o resto do código da aplicação para dentro do container
COPY . .

# Expõe a porta que a aplicação vai usar
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "start"]