FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built application
COPY dist ./dist
COPY templates ./templates

# Expose port
EXPOSE 3001

# Start application
CMD ["node", "dist/index.js"]
