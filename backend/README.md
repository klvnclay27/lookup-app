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

## Development user data

The backend includes a development-only JSON-file user repository seeded with the non-sensitive user ID `demo-user`. The seed remains an internal development fixture; it is not exposed through a public user-ID route.

Data is keyed by user ID and stored at `backend/data/users.json`. On first use, a missing file is created with the demo profile; an existing valid file is loaded without being overwritten. Updates use a temporary file and atomic rename. A malformed or unreadable store produces a safe API error instead of silently replacing the file with invented data.

The mutable `users.json` file and temporary write files are ignored by Git. This file-backed store is only for local MVP development. The existing `UserRepository` interface is the boundary a future database implementation will replace. No account, authentication, or database service exists yet.

Smart Mode is also exposed through the dedicated preferences endpoints. The preference payload currently contains only `smartModeEnabled`; unsupported preference fields are rejected. The profile endpoint remains backward compatible during this migration.

## Authentication

The `/api/v1/me/*` routes require a Supabase access token in the `Authorization: Bearer <token>` header. The backend validates the token with Supabase Auth, derives the storage key from the verified token's user ID, and never accepts a client-provided user ID for these routes. A first request creates an isolated local profile with safe defaults when that authenticated user has no profile yet.

The older `/api/v1/users/:userId/*` routes are not mounted. Authenticated profile and preference access is available only through `/api/v1/me/*`, which derives ownership from the verified Supabase token.

Usernames are normalized to lowercase and stored with the local profile while the verified Supabase user ID remains the authorization and storage identity. Username/password sign-in is proxied through the backend so username-to-email resolution never reaches an unauthenticated client; the backend passes credentials directly to Supabase Auth and does not store or log passwords. Existing users without usernames remain valid and can claim one through their protected profile.

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

No paid service, database server, service-role credential, or backend secret is used at this stage. Supabase Auth and the RLS-protected `public.user_profiles` table use the public project URL and publishable key loaded from the ignored local environment file. Authenticated profile requests forward the user's Bearer token to Supabase; username reads and writes are therefore limited by the table's RLS policies. Display name and Smart Mode remain in the local file-backed store during this migration.
