# Nexa Portal

Nexa Portal is a team portal built with Next.js 16, React 19, and Supabase Auth/Postgres. Portal records are stored in the Supabase app_records table and protected by row-level security.

## Local setup

Requirements: Node.js 20.9 or later.

1. Install packages with npm install.
2. Copy .env.example to .env.local.
3. Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to the publishable key from the Nexa Supabase project.
4. Start the app with npm run dev.
5. Open http://localhost:3000.

The Supabase URL is already listed in .env.example. Keep .env.local out of Git. The browser app needs the publishable key; never put a Supabase service_role key in a NEXT_PUBLIC variable or commit it.

## Supabase setup

The migration files in supabase/migrations define the portal tables, role policies, attendance clock, and client project access. Apply them in filename order when preparing a fresh Supabase project. The connected Nexa project already has the current migrations applied.

New accounts remain pending until an administrator assigns the correct role and activates them in Dashboard → Settings → User Access. A fresh Supabase project needs one trusted initial administrator bootstrapped as admin/active in user_profiles through the project owner's secure database session.

In Supabase Auth settings, allow the production site and localhost callback URLs for password recovery. Enable leaked-password protection under Authentication → Password Security.

## Vercel environment

For each Vercel environment that should run the portal, configure:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

Then redeploy. The app intentionally fails its build when either value is missing, because a deployment without the Supabase connection cannot serve sign-in or portal data.

## Common commands

    npm run dev
    npm run lint
    npm run build
    npm start
