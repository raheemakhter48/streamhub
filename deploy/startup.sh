#!/bin/bash

# Azure App Service startup script
cd /home/site/wwwroot

# Install dependencies if package.json changed
if [ -f package.json ]; then
  npm install --production
fi

# Start the application
node server.js

