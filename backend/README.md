# LookUP backend

This folder contains the TypeScript backend foundation for LookUP. It currently exposes two keyless endpoints:

```text
GET /health
GET /api/v1/status
GET /api/v1/users/:userId/profile
PATCH /api/v1/users/:userId/profile
GET /api/v1/users/:userId/preferences
PATCH /api/v1/users/:userId/preferences
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

No database, authentication, external API, API key, or secret is used at this stage.
