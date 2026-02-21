FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install


# Expose the port defined in package.json (dev script uses port 3003)
EXPOSE 5173

# Run the dev server and bind to 0.0.0.0
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0","--port", "5173"]
