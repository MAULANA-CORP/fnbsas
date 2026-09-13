#!/bin/sh
set -e
cd /app
if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL belum diisi"
  exit 1
fi
if [ -x ./node_modules/.bin/prisma ]; then
  echo "Sync schema PostgreSQL..."
  ./node_modules/.bin/prisma db push --skip-generate
else
  echo "Prisma CLI tidak ada di image — skip db push"
fi
exec node server.js
