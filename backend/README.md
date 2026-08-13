# LookUP backend

This folder contains the TypeScript backend foundation for LookUP. Health/status endpoints are public, current-user endpoints require Supabase authentication, and legacy user-ID endpoints are local-development-only:

```text
GET /health
GET /api/v1/status
GET /api/v1/users/:userId/profile
PATCH /api/v1/users/:userId/profile
GET /api/v1/users/:userId/preferences
PATCH /api/v1/users/:userId/preferences
GET /api/v1/me/profile
PATCH /api/v1/me/profile
GET /api/v1/me/preferences
PATCH /api/v1/me/preferences
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

The backend includes a development-only JSON-file user repository seeded with the non-sensitive user ID `demo-user`. It supports reading a profile and updating only `displayName` and `smartModeEnabled`:

```sh
curl http://localhost:4000/api/v1/users/demo-user/profile
curl -X PATCH http://localhost:4000/api/v1/users/demo-user/profile -H "Content-Type: application/json" -d "{\"smartModeEnabled\":false}"
```

Data is keyed by user ID and stored at `backend/data/users.json`. On first use, a missing file is created with the demo profile; an existing valid file is loaded without being overwritten. Updates use a temporary file and atomic rename. A malformed or unreadable store produces a safe API error instead of silently replacing the file with invented data.

The mutable `users.json` file and temporary write files are ignored by Git. This file-backed store is only for local MVP development. The existing `UserRepository` interface is the boundary a future database implementation will replace. No account, authentication, or database service exists yet.

Smart Mode is also exposed through the dedicated preferences endpoints. The preference payload currently contains only `smartModeEnabled`; unsupported preference fields are rejected. The profile endpoint remains backward compatible during this migration.

## Authentication

The `/api/v1/me/*` routes require a Supabase access token in the `Authorization: Bearer <token>` header. The backend validates the token with Supabase Auth, derives the storage key from the verified token's user ID, and never accepts a client-provided user ID for these routes. A first request creates an isolated local profile with safe defaults when that authenticated user has no profile yet.

The older `/api/v1/users/:userId/*` routes are retained only when `NODE_ENV` is not `production` for compatibility with local development. The normal frontend uses `/api/v1/me/*` and no longer reads or writes `demo-user` after a Supabase user signs in.

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

The frontend bridge is `src/services/backend-client.ts`. It centralizes requests, validates responses, and reports available, unavailable, and error states without putting raw backend fetch logic in screens. It defaults to `http://localhost:4000` for local web development.

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

For local web development, the server returns CORS headers only to loopback origins (`localhost`, `127.0.0.1`, or `::1`). Native applications do not use browser CORS. Production CORS policy will be configured when a production host exists.

No paid service, database server, service-role credential, or backend secret is used at this stage. Supabase Auth is the sole authentication provider; its public project URL and publishable key are loaded from the ignored local environment file.
