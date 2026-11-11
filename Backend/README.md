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

Most Supabase setup is managed outside this repository. The account preference
schema and seed data are provided in `supabase/account_preferences.sql`; run it
in the Supabase SQL Editor before using the preference editor. The running
backend also expects:

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
- An authenticated `UPDATE` column grant for `username`, `home_zip`, and
  `phone_number`, plus an enabled `validate_profile_fields` trigger that checks
  usernames and ZIP codes against `signup_policy` on profile insert and update.
  The case-insensitive unique index remains the final username uniqueness
  check. Account updates are made with the signed-in customer's access token
  and restricted by the profile update policy.

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

Recommendation preferences are stored in the signed-in user's
`public.profiles` row in `recommendation_budget`, `recommendation_goal`, and
`excluded_allergens`. The options shown in the homepage and account editor are
read from `public.recommendation_goal_options` and
`public.dietary_restriction_options`; the profile trigger validates writes
against those same tables. To configure this setup, run
`supabase/account_preferences.sql` in the Supabase SQL Editor. Update option
labels, sort order, or enabled status in those tables; adding or disabling
options then flows through to both interfaces. Saved preferences do not
currently change recommendations. Profile preference writes use the
customer's access token and own-row RLS policy. The SQL setup does not migrate
or modify existing customer data.

Run `supabase/account_distance_preferences.sql` after the account-preferences
setup to add the customer's distance-limit toggle and radius fields to
`public.profiles`. A null radius represents “Any distance”; otherwise the
database accepts integer miles from 1 to 100. These settings are saved even
when the distance-limit toggle is off. New profiles default to distance
limiting off and a 10-mile radius.

### Adding a recommendation goal

The Supabase goal-options table controls which goals appear in the homepage and
account editor; it does not implement ranking behavior. Goal algorithms are
implemented in `Frontend/lib/value.js` in the `rank` function, using the
`goal` key as the selector. To add a working goal:

1. Implement its ranking behavior in `rank` and update related display logic
   such as `ratioLabel` and `winnerMetric` as appropriate.
2. Add the matching `goal_key`, customer-facing `label`, and winner label to
   `public.recommendation_goal_options` in a Supabase SQL migration or the
   Supabase SQL Editor.
3. Keep the goal key identical in code and Supabase, then test ranking and
   display behavior.

Adding a row in Supabase alone only makes the option selectable; without
matching ranking code, the current ranking logic may use its default behavior.
Likewise, code alone will not make the goal selectable unless it is enabled in
Supabase. Include the option-table change in the same reviewed change as the
algorithm where possible, so deploying it does not require an undocumented
manual dashboard update.

## server.js
