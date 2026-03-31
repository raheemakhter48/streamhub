FROM node:20-alpine

WORKDIR /app

# Copy backend package files from the backend directory
COPY backend/package*.json ./

# Install dependencies
RUN npm install --production

# Copy backend application files
COPY backend/ .

# Hugging Face default port
ENV PORT=7860
EXPOSE 7860

# Start application
CMD ["node", "server.js"]
