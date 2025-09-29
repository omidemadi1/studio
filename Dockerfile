# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source. This is copied after `npm install` so that changes
# to the code don't invalidate the dependency cache.
COPY . .

# Build the Next.js application
RUN npm run build

# Your app binds to port 3000, so expose it
EXPOSE 3000

CMD [ "npm", "start" ]
