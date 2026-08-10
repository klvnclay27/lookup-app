# LookUP backend

This folder contains the initial TypeScript backend foundation for LookUP. It currently exposes one keyless endpoint:

```text
GET /health
```

The response confirms that the local backend process is available:

```json
{
  "status": "ok",
  "service": "lookup-backend"
}
```

## Run locally

From the project root, use Node.js 24 or newer:

```sh
npm run backend:start
```

The server listens on `http://localhost:4000` by default. Set the standard `PORT` environment variable to use another port. Check it with:

```sh
curl http://localhost:4000/health
```

Validate its TypeScript separately with:

```sh
npm run backend:check
```

## Future organization

Add HTTP route handlers under `backend/src/routes/` and backend-only business/provider integrations under `backend/src/services/` as features are connected. Planned feature areas include Weather, Sports, Entertainment, Finance, Music, Traffic/Transportation, My Locker, and Daily Intelligence.

The existing `src/services/` directory remains the app-facing normalized data layer. Backend integrations should fulfill those contracts through API responses instead of duplicating screen logic here.

No database, authentication, external API, API key, or secret is used at this stage.
