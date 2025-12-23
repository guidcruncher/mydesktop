#!/bin/sh

echo "{" > /app/dist/public/config.json

echo "  \"API_BASE_URL\": \"$API_BASE_URL\"" >> /app/dist/public/config.json

echo "}" >> /app/dist/public/config.json

node ./dist/index.js

