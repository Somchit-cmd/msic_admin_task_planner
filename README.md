# MSIC Admin Task Planner

A modern, full-stack task planning application built for teams. Manage tasks, track deadlines, assign work, and monitor progress through an intuitive dashboard — all in one place.

## Features

- **Dashboard** — Overview with task statistics, charts, and progress tracking
- **Task Management** — Create, edit, delete, and organize tasks with categories, priorities, and deadlines
- **Today's Tasks** — Quick view of tasks scheduled for today
- **Deadline Tracker** — See upcoming and overdue tasks at a glance
- **User Management** — Admin can create, edit, deactivate users and manage roles
- **System Settings** — Fully customizable categories, priorities, and statuses with color coding
- **Role-Based Access** — Admin and regular user roles with granular permissions
- **Session Auth** — Secure cookie-based authentication with "Remember Me" support
- **Responsive Design** — Works on desktop, tablet, and mobile
- **Dark Mode** — Automatic theme switching based on system preference

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | PostgreSQL (Neon) |
| ORM | Prisma 6 |
| State | Zustand |
| Charts | Recharts |
| Auth | Custom session-based (bcryptjs) |
| Deployment | Cloudflare Pages |

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A PostgreSQL database ([Neon](https://neon.tech) recommended for Cloudflare Pages)

### 1. Clone the repository

```bash
git clone https://github.com/Somchit-cmd/msic_admin_task_planner.git
cd msic_admin_task_planner
```

### 2. Install dependencies

```bash
bun install
# or
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and set your database connection:

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

### 4. Set up the database

```bash
bun run db:generate
bun run db:push
```

### 5. Start the development server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Default Login

The admin account is automatically seeded on first login:

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin123` |

> **Important:** Change the admin password immediately after first login.

## Project Structure

```
msic_admin_task_planner/
├── prisma/
│   └── schema.prisma          # Database models (User, Task, Session, SystemSetting)
├── src/
│   ├── app/
│   │   ├── page.tsx           # Main application page (SPA with view routing)
│   │   ├── layout.tsx         # Root layout with fonts and metadata
│   │   └── api/
│   │       ├── auth/          # Login, logout, session, seed-admin
│   │       ├── tasks/         # Task CRUD endpoints
│   │       ├── users/         # User management endpoints
│   │       └── settings/      # System settings endpoints
│   ├── components/
│   │   ├── views/             # Page views (dashboard, tasks, users, settings)
│   │   ├── ui/                # shadcn/ui components
│   │   ├── auth-page.tsx      # Login page
│   │   └── task-form-dialog.tsx
│   ├── lib/
│   │   ├── auth.ts            # Auth helpers (session, login, logout)
│   │   ├── db.ts              # Prisma client instance
│   │   └── rate-limit.ts      # Login rate limiter
│   └── store/
│       ├── auth-store.ts      # Auth state (Zustand)
│       ├── task-store.ts      # Task state (Zustand)
│       └── settings-store.ts  # Settings state (Zustand)
├── .env                       # Environment variables (not committed)
└── package.json
```

## Deployment

### Cloudflare Pages

1. Push your code to GitHub
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → Pages
3. Connect your GitHub repository
4. Set the following:

| Setting | Value |
|---------|-------|
| Build command | `npx next build` |
| Build output directory | `.next` |
| Node.js version | `18` |

5. Add environment variable:
   - `DATABASE_URL` = your Neon PostgreSQL connection string

> **Note:** This project uses `output: "standalone"` in `next.config.ts`. For Cloudflare Pages, you may need to use `@cloudflare/next-on-pages` adapter or deploy via a Docker container.

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |

## Security

- Cookie-based session authentication (`httpOnly`, `secure` in production)
- Password hashing with bcryptjs (cost factor 10)
- Login rate limiting (5 attempts per 15 minutes)
- Role-based API authorization
- Security headers (X-Frame-Options, HSTS, CSP-related)
- Input validation on all API endpoints

## License

MIT
