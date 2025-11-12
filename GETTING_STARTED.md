# Getting Started with FieldForm

## 🎉 Welcome!

This guide will help you get your FieldForm development environment up and running.

## Prerequisites

- **Node.js** 18 or later
- **Docker & Docker Compose**
- **npm** 10 or later

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Infrastructure Services

```bash
# Start PostgreSQL, Redis, and MinIO
docker-compose up -d

# Or use the setup script
./scripts/setup.sh
```

### 3. Set Up Environment Variables

The project includes a `.env.local` file in `apps/web/` with default development values. You can customize these if needed.

### 4. Generate Prisma Client & Run Migrations

```bash
cd packages/database
npm run db:generate
npm run db:push
cd ../..
```

### 5. Start Development Server

```bash
npm run dev
```

Your app will be running at **http://localhost:3000** 🚀

## 🐳 Docker Services

When you run `docker-compose up -d`, these services start:

| Service | URL | Credentials |
|---------|-----|-------------|
| **PostgreSQL** | `localhost:5432` | postgres / postgres |
| **Redis** | `localhost:6379` | (no auth) |
| **MinIO API** | `http://localhost:9000` | minioadmin / minioadmin |
| **MinIO Console** | `http://localhost:9001` | minioadmin / minioadmin |

## 📦 Project Structure

```
fieldform/
├── apps/
│   └── web/           # Next.js web application
├── packages/
│   ├── database/      # Prisma schema and client
│   ├── types/         # Shared TypeScript types
│   └── ui/            # Shared UI components
├── scripts/           # Utility scripts
└── docker-compose.yml # Infrastructure services
```

## 🔧 Available Commands

### Root Commands
- `npm run dev` - Start all apps in development mode
- `npm run build` - Build all apps for production
- `npm run lint` - Lint all packages
- `npm run type-check` - Run TypeScript type checking
- `npm run format` - Format code with Prettier

### Database Commands (in `packages/database/`)
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:studio` - Open Prisma Studio (database GUI)

## 🔍 Verifying Your Setup

1. **Check Docker services are running:**
   ```bash
   docker ps
   ```
   You should see 3 containers: postgres, redis, and minio

2. **Check database connection:**
   ```bash
   cd packages/database && npm run db:studio
   ```
   This opens Prisma Studio at `http://localhost:5555`

3. **Visit the web app:**
   Open `http://localhost:3000` in your browser

## 🐛 Troubleshooting

### Docker services won't start
```bash
# Stop all containers
docker-compose down

# Remove volumes and start fresh
docker-compose down -v
docker-compose up -d
```

### Database connection errors
- Ensure PostgreSQL container is running: `docker ps | grep postgres`
- Check logs: `docker logs fieldform-postgres`
- Verify DATABASE_URL in `apps/web/.env.local`

### Dependencies installation issues
```bash
# Clean install
rm -rf node_modules package-lock.json
rm -rf apps/*/node_modules packages/*/node_modules
npm install
```

## 📚 Next Steps

Now that your environment is set up, you can:

1. **Explore the codebase** - Start with `apps/web/src/app/page.tsx`
2. **Build your first form** - Coming soon!
3. **Read the architecture docs** - See `plan.md` for the complete system design
4. **Add features** - Check the TODOs and pick something to work on

## 🤝 Development Workflow

1. Create a new branch for your feature
2. Make your changes
3. Run `npm run lint` and `npm run type-check`
4. Test your changes locally
5. Commit and push

## 📖 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 💬 Need Help?

- Check the `/plan.md` file for architecture details
- Review the `/README.md` for project overview
- Inspect Docker logs: `docker-compose logs -f`

Happy coding! 🚀

