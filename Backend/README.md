# Server

The contents of this directory include our backend logic (such as database, services, persistence, middleware, route handlers, etc.)

## Backend/config/

## Backend/db/

## Backend/middleware/

## Backend/services/

## Backend/routes/

### Backend/routes/account/
Order history is handled by `orders.js` at `/api/auth/orders`.

## Supabase signup profile policy

The Supabase database is configured outside this repository; its SQL setup is
not version-controlled here. The running backend expects:

- A `public.signup_policy` row defining the username and ZIP rules. The current
  rules are usernames of 3–24 letters, numbers, periods, underscores, or
  hyphens; usernames are unique regardless of capitalization; ZIP codes
  contain five digits. `GET /api/auth/signup-policy` reads this policy for the
  live username/ZIP checklist in `Frontend/components/AuthDialog.jsx`.
- A `public.profiles` table with `id`, `username`, `home_zip`, `phone_number`,
  and `created_at` columns. An `auth.users` trigger validates Bitewise signup
  metadata and creates profile rows.
- The `get_signup_policy` RPC used by the signup form and
  `check_signup_username_available` RPC used for its debounced username check.
- Row-level security that lets authenticated users read only their own profile.

The signup-policy table is the source of truth for username and ZIP validation.
Update its row in Supabase to change those rules. The form reads the rules when
the signup flow opens. Signup is submitted to Supabase Auth first. If Auth or
the database trigger rejects signup, the backend rechecks username and ZIP
against the Supabase policy and returns field-specific profile errors alongside
any explicit Auth error. The form displays these errors; the database trigger
remains the final enforcement layer.

The availability check is only a preview: the database trigger and
case-insensitive unique index enforce uniqueness at account creation.
`check_signup_username_available` is callable without authentication and can
reveal whether a username is registered, so consider rate-limiting this
endpoint before public launch.

Password requirements are different: `PASSWORD_MIN_LENGTH` in
`Frontend/components/AuthDialog.jsx` controls only the red/green display
guidance. Supabase Auth enforces the actual password policy during signup.
Keep the guidance synchronized manually if the Supabase Auth policy changes;
there is no Management API token or live password-policy query in the app.

Email and password authentication remain handled by Supabase Auth. Email
confirmation behavior is configured in Supabase; when signup returns no
session, the UI gives neutral guidance to check for a confirmation email or
log in if the address already has an account. This avoids claiming an account
was created when Supabase intentionally returns a non-error response for an
already-registered email. Profile reads use the caller's Supabase access token
and are restricted by the `profiles_select_own` row-level security policy.
Order-history routes also require a valid Supabase session.

## server.js
