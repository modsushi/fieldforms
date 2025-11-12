#!/bin/bash

# FieldForm Setup Script
echo "🚀 Setting up FieldForm development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker exec fieldform-postgres pg_isready -U postgres > /dev/null 2>&1; do
    sleep 1
done
echo "✅ PostgreSQL is ready"

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
until docker exec fieldform-redis redis-cli ping > /dev/null 2>&1; do
    sleep 1
done
echo "✅ Redis is ready"

# Wait for MinIO to be ready
echo "⏳ Waiting for MinIO to be ready..."
sleep 5
echo "✅ MinIO is ready"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
cd packages/database && npm run db:generate && cd ../..

# Run migrations
echo "🗄️  Running database migrations..."
cd packages/database && npm run db:push && cd ../..

echo "✨ Setup complete!"
echo ""
echo "To start developing:"
echo "  npm run dev"
echo ""
echo "Services running:"
echo "  📱 Web App: http://localhost:3000"
echo "  🗄️  PostgreSQL: localhost:5432"
echo "  🔴 Redis: localhost:6379"
echo "  💾 MinIO Console: http://localhost:9001"
echo ""
echo "Happy coding! 🎉"

