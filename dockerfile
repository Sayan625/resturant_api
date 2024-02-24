# Use official Node.js image as the base image
FROM node:18-alpine

# Set working directory within the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package.json ./

# Install dependencies
RUN npm install


# Copy the rest of the application code to the working directory
COPY . .


# Expose the port your application listens on
EXPOSE 3000

# Set environment variable for JWT secret key
ENV JWT_KEY="23"
ENV DB_URI="mongodb+srv://Admin:1234@cluster0.gcivl.mongodb.net/sample_restaurants?retryWrites=true&w=majority"

# Command to run your application
CMD ["npm", "start"]