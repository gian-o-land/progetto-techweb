FROM node:20-alpine

WORKDIR /app

# Copia i file delle dipendenze e installale
COPY package*.json ./
RUN npm install

# Copia il resto del codice sorgente
COPY . .

EXPOSE 3000

# Avvia in modalità sviluppo
CMD ["npm", "run", "dev"]