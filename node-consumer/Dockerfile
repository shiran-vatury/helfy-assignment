# Use official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json & install dependencies
COPY package*.json ./
RUN npm install

# Copy app code
COPY . .

# Create logs folder inside container
RUN mkdir -p /usr/share/filebeat/logs

# Expose port for Prometheus metrics
EXPOSE 3000

# Start the consumer
CMD ["node", "index.js"]
