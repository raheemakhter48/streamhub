FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY . .

# Hugging Face default port
ENV PORT=7860
EXPOSE 7860

# Start application
CMD ["node", "server.js"]

