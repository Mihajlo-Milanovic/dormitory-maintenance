#!/bin/sh

set -e

echo "Pushing database schema..."
npx prisma db push --accept-data-loss

echo "Seeding database..."
npx prisma db seed

echo "Starting application..."
exec node dist/main.js
