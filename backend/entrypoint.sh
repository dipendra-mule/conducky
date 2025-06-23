#!/bin/sh
set -e

# Install dependencies if needed (for dev, since node_modules is a volume)
if [ ! -d "node_modules" ]; then
  npm install
fi

# Generate Prisma client and run migrations
echo "Generating Prisma client..."
npx prisma generate

echo "Running Prisma migrations..."
# Try to run migrations, but don't fail the container if they fail
if npx prisma migrate deploy; then
  echo "✅ Migrations completed successfully"
else
  echo "⚠️ Migrations failed - container will start anyway"
  echo "⚠️ You may need to run migration fix commands manually"
  echo "⚠️ Commands to run:"
  echo "⚠️   npm run migrate:fix-state"
  echo "⚠️   npm run migrate:unified-roles"
fi

# Always ensure roles are seeded correctly (but don't fail if it fails)
echo "Seeding roles..."
if npm run seed:roles; then
  echo "✅ Roles seeded successfully"
else
  echo "⚠️ Role seeding failed - may need manual migration"
fi

# Always ensure email templates are available (needed for both dev and prod)
echo "Ensuring email templates are available..."
mkdir -p /app/dist/email-templates
cp -r /app/email-templates/* /app/dist/email-templates/

if [ "$NODE_ENV" = "production" ]; then
  echo "Building TypeScript for production..."
  npm run build
  echo "Starting TypeScript backend server (production)..."
  npm run start:ts
else
  echo "Starting TypeScript backend server (development with live reload)..."
  npm run dev:ts
fi 