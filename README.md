# DrishAI — Step 1 Scaffold

Auth + role-based routing, built per the master project brief. This gives you
a working foundation: real login/register, a real database, and four
protected dashboards (Patient / Doctor / NGO / Admin) ready for the next
modules (image upload, AI inference, reports, etc.).

## What's included

- **Next.js 14 (App Router) + TypeScript + Tailwind CSS**
- **Auth**: email/password via NextAuth (Credentials provider), JWT sessions,
  bcrypt-hashed passwords
- **Role-based access control**: `middleware.ts` protects `/patient`,
  `/doctor`, `/ngo`, `/admin` — each route checks the signed-in user's role
  and bounces mismatches to their own dashboard. Each dashboard `layout.tsx`
  repeats the check server-side as defense in depth.
- **Database**: Prisma schema matching the brief exactly — `User`, `Patient`,
  `ScreeningRecord`, `RetinalImage`, `AiAnalysis`, with the same relationships
  (one patient → many screenings → many images / one AI analysis). Uses
  SQLite for zero-setup local dev; swap the datasource to Postgres
  (Supabase) for production without touching the schema shape.
- **Placeholder dashboards** for all four roles, styled and structured so you
  can drop in the real modules (scan upload, patient table, bulk NGO tools,
  admin user management) without rebuilding the shell.
- Medical disclaimer banner shown on every page, per the non-functional
  requirements.

## Getting started

```bash
npm install
cp .env.example .env
# optional: generate a real secret
# openssl rand -base64 32   -> paste into NEXTAUTH_SECRET

npm run db:push      # create the SQLite database from the Prisma schema
npm run db:seed       # create one demo user per role (password: password123)
npm run dev
```

Visit `http://localhost:3000`. Demo logins after seeding:

| Role   | Email                | Password      |
|--------|-----------------------|----------------|
| Admin  | admin@drishai.dev     | password123    |
| Doctor | doctor@drishai.dev    | password123    |
| NGO    | ngo@drishai.dev       | password123    |
| Patient| patient@drishai.dev   | password123    |

## Project structure

```
app/
  page.tsx                 landing page
  login/page.tsx           login form
  register/page.tsx        registration form with role picker
  patient/                 patient dashboard (layout = role guard + nav)
  doctor/                  doctor dashboard
  ngo/                     NGO dashboard
  admin/                   admin dashboard
  api/
    auth/[...nextauth]/    NextAuth handler
    register/              registration endpoint
    post-login-redirect/   sends a freshly logged-in user to their dashboard
lib/
  auth.ts                  NextAuth config, role→home map
  prisma.ts                Prisma client singleton
prisma/
  schema.prisma            DB schema matching the brief
  seed.ts                  demo accounts
middleware.ts               route-level role protection
```

## Moving to Postgres/Supabase

1. In `prisma/schema.prisma`, change `provider = "sqlite"` to
   `provider = "postgresql"`.
2. Set `DATABASE_URL` in `.env` to your Supabase connection string.
3. Run `npm run db:push` (or set up migrations with `prisma migrate dev`).

## What's next (per the brief's build order)

1. ✅ Auth (login/signup) + role-based routing — **this scaffold**
2. Patient dashboard: upload flow → AI grading → report screen
3. Doctor dashboard: real patient table → profile → scan history
4. NGO dashboard: bulk patient management + send-to-doctor workflow
5. Admin dashboard: real user/role management
6. Voice assistant + chatbot integration

The Image Processing and AI Inference modules (TensorFlow.js, on-device
YOLO-based DR grading) aren't wired in yet — that's the natural next step
once you're ready to build the Patient upload flow.
