# LookUP backend

This folder contains the TypeScript backend foundation for LookUP. Health/status and authentication endpoints are public, while current-user endpoints require Supabase authentication:

```text
GET /health
GET /api/v1/status
GET /api/v1/me/profile
PATCH /api/v1/me/profile
GET /api/v1/me/preferences
PATCH /api/v1/me/preferences
POST /api/v1/auth/sign-in
POST /api/v1/auth/sign-up
```

The response confirms that the local backend process is available:

```json
{
  "status": "ok",
  "service": "lookup-backend"
}
```

`/api/v1` is the versioned namespace for app-facing endpoints. The status endpoint returns:

```json
{
  "status": "ok",
  "service": "lookup-backend",
  "apiVersion": "v1"
}
```

## User data

Authenticated account data is stored in the RLS-protected Supabase `public.user_profiles` table. The row ID is the verified Supabase Auth user ID, and username, display name, and Smart Mode are persisted in that row. Run `supabase/migrations/001_persist_account_profiles.sql` in the Supabase SQL Editor before deploying this backend version.

Normal `/api/v1/me/*` profile and preference requests forward the signed-in user's Bearer token to Supabase, so row-level security enforces ownership. The server-only `SUPABASE_SERVICE_ROLE_KEY` is used only by the public sign-up and username sign-in flow to create a profile and resolve a username to its Supabase Auth user. It must be stored only in the backend environment and must never use an `EXPO_PUBLIC_` name.

Smart Mode is exposed through the dedicated preferences endpoints. The preference payload currently contains only `smartModeEnabled`; unsupported preference fields are rejected.

## Authentication

The `/api/v1/me/*` routes require a Supabase access token in the `Authorization: Bearer <token>` header. The backend validates the token with Supabase Auth, derives the storage key from the verified token's user ID, and never accepts a client-provided user ID for these routes. A first request creates an isolated Supabase profile with safe defaults when that authenticated user has no profile yet.

The older `/api/v1/users/:userId/*` routes are not mounted. Authenticated profile and preference access is available only through `/api/v1/me/*`, which derives ownership from the verified Supabase token.

Usernames are normalized to lowercase and protected by a case-insensitive unique database index. Username/password sign-in is proxied through the backend so username-to-email resolution never reaches an unauthenticated client; the backend passes credentials directly to Supabase Auth and does not store or log passwords. Existing users without usernames remain valid and can claim one through their protected profile.

## Run locally

From the project root, use Node.js 24 or newer:

```sh
npm run backend:start
```

The server listens on `http://localhost:4000` by default. Set the standard `PORT` environment variable to use another port. Check it with:

```sh
curl http://localhost:4000/health
curl http://localhost:4000/api/v1/status
```

Validate its TypeScript separately with:

```sh
npm run backend:check
```

## Future organization

Add HTTP route handlers under `backend/src/routes/` and backend-only business/provider integrations under `backend/src/services/` as features are connected. Planned feature areas include Weather, Sports, Entertainment, Finance, Music, Traffic/Transportation, My Locker, and Daily Intelligence.

The existing `src/services/` directory remains the app-facing normalized data layer. Backend integrations should fulfill those contracts through API responses instead of duplicating screen logic here.

The frontend bridge is `src/services/backend-client.ts`. It centralizes requests, validates responses, and reports available, unavailable, and error states without putting raw backend fetch logic in screens. Development builds default to `http://localhost:4000`; production builds require `EXPO_PUBLIC_LOOKUP_BACKEND_URL` to be set to the public HTTPS backend origin when the web export is created.

To use a different backend host, set the public, non-secret Expo variable before starting the app:

```text
EXPO_PUBLIC_LOOKUP_BACKEND_URL=http://192.168.1.25:4000
```

Use the development computer's LAN address for a physical phone. A later staging or production deployment can set the same variable to its HTTPS backend URL. Never put credentials or secrets in an `EXPO_PUBLIC_` variable because it is included in the client bundle.

Run the frontend and backend in separate terminals:

```sh
npm run backend:start
npm run start
```

For local web development, the server returns CORS headers to loopback origins (`localhost`, `127.0.0.1`, or `::1`). A deployed backend must set `LOOKUP_ALLOWED_ORIGINS` to a comma-separated list of exact trusted web origins, such as `https://lookup-app-kc.expo.app`. Wildcard origins are not used, and native applications do not use browser CORS.

No paid service or separate database server is used. Supabase Auth and the RLS-protected `public.user_profiles` table remain on the Supabase free tier. Authenticated profile requests forward the user's Bearer token to Supabase. The service-role credential is confined to the backend environment for username lookup and account creation and is never included in the Expo bundle.
