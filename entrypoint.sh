#!/bin/sh

echo "{" > /app/dist/public/config.json

if [ "$CONTAINER" == "true" ]; then
echo "  \"API_BASE_URL\": \"\"" >>  /app/dist/public/config.json
else
echo "  \"API_BASE_URL\": \"$API_BASE_URL\"" >> /app/dist/public/config.json
fi

echo "}" >> /app/dist/public/config.json

node ./dist/index.js

