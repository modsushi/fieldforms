# FieldForm

A flexible, offline-first field form solution that replaces paper-based forms for outdoor operations. Built with composable primitives to support complex workflows without rigid categorization.

## 🚀 Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Shadcn/ui
- **State Management**: Zustand, TanStack Query
- **Backend**: tRPC, PostgreSQL, Prisma
- **Offline**: Dexie.js (IndexedDB)
- **Mobile**: Capacitor

## 📁 Project Structure

```
fieldform/
├── apps/
│   ├── web/          # Next.js web application
│   └── mobile/       # Capacitor mobile app (coming soon)
├── packages/
│   ├── database/     # Prisma schema and client
│   ├── types/        # Shared TypeScript types
│   └── ui/           # Shared UI components
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ with PostGIS extension
- Redis (for job queues)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fieldforms
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp apps/web/.env.example apps/web/.env
# Edit .env with your database credentials
```

4. Set up the database:
```bash
cd packages/database
npm run db:migrate
```

5. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run format` - Format code with Prettier

## 🏗️ Development Status

### ✅ Completed
- [x] Monorepo setup with Turborepo
- [x] Next.js 14 with App Router
- [x] TypeScript configuration
- [x] Tailwind CSS setup
- [x] Shared packages structure

### 🚧 In Progress
- [ ] Database schema with Prisma
- [ ] Authentication with NextAuth.js
- [ ] Form builder UI
- [ ] Offline sync system

## 📖 Documentation

See the [plan.md](./plan.md) file for the complete implementation plan.

## 📄 License

Proprietary - All rights reserved

