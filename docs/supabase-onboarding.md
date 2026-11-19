# Nexa Portal Supabase onboarding

The application connects to the `nexa portal` project. Client authentication uses Supabase Auth, and portal modules are stored in `public.app_records` with role-based row-level security. Passwords belong only to Supabase Auth.

## Configure a deployment

Set these environment variables in the host (and copy `.env.example` to `.env.local` for local development):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The publishable key is intended for the browser. Do not put a Supabase secret or service-role key in `NEXT_PUBLIC_*` variables.

Fee reminder delivery also needs one mail provider configured on the server: `RESEND_API_KEY` and `RESEND_FROM_EMAIL`, or `SMTP_USER` and `SMTP_PASS`.

Supabase Auth confirmation emails use the project's custom SMTP settings. For Resend, use host `smtp.resend.com`, port `587`, username `resend`, the Resend API key as the SMTP password, and a sender address verified by Resend. Supabase's default email service is rate-limited and intended for development.

## Create the first administrator

1. Open the portal's `/signup` page and create the intended owner's account.
2. Confirm the email if Supabase Auth asks for confirmation.
3. In the SQL Editor for the same Supabase project configured in the app, open `supabase/bootstrap_first_admin.sql` and run the statement. It promotes only the confirmed `nexa@admin.com` account.
4. Confirm the query returns a row with `role = admin` and `status = active`.
5. Sign in at `/login` using that account's email and the password chosen during signup. There is no separate admin password.

Self-signup creates a `pending` profile and never accepts a role from the browser. This first role promotion is manual on purpose so another visitor cannot claim administrator access.

If the query returns no row, check that `nexa@admin.com` has signed up and confirmed its email in this exact Supabase project. The bootstrap statement intentionally will not promote a different email. Do not share or use another team member's password to get admin access.

## Add the team

Team members create their own account at `/signup`. In **Dashboard → Settings → Manage team access**, assign each account its role and set its status to **Active**. The account owner then signs in with their own password. The admin does not set or store other people's passwords.

Available roles: `admin`, `manager`, `hr`, `employee`, `intern`, `student`, and `client`. Use `inactive` to revoke portal access; leave unapproved accounts `pending`.

The dashboard reads each role from `user_profiles`; a browser-stored role is not sufficient for access. After an administrator changes a role or status, have that user sign out and sign in again so the portal reloads the approved access.

## Database migrations

The migrations in `supabase/migrations/` create the profile trigger, module store, RLS policies, and admin role-management permissions. The project is already migrated; keep these files in source control for future environments.

