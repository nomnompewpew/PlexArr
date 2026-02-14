FROM node:18-alpine as build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY tsconfig.json ./
COPY src ./src
COPY templates ./templates

# Build the app
RUN npm run build

FROM node:18-alpine

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy built application
COPY --from=build /app/dist ./dist
COPY --from=build /app/templates ./templates

# Expose port
EXPOSE 3001

# Start application
CMD ["node", "dist/index.js"]
