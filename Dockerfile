# Base image
FROM node:20

# Set workdir
WORKDIR /usr/src/app

# Copy package.json & package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Expose port (don't change the port 7860 if you deploy at huggingface)
EXPOSE 7860

# Run the app
CMD ["node", "."]
