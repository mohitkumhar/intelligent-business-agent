#!/bin/sh
set -e
cd /app
# Keep node_modules in sync when package.json changes (bind mount + anonymous volume).
npm install
exec "$@"
