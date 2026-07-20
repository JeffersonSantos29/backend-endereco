# imagem oficial do Node.js - alpine
FROM node:22-alpine

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia apenas os arquivos de dependências e o schema do Prisma primeiro
# (o postinstall roda "prisma generate", que precisa do schema.prisma presente)
COPY package*.json ./
COPY prisma ./prisma

# Instala as dependências
RUN npm install

# Copia o resto do código da aplicação para dentro do container
COPY . .

# Expõe a porta que a aplicação vai usar
EXPOSE 3000

# Aplica migrations pendentes e só então sobe o servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]