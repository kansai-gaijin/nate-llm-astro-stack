# microCMS provisioning contract

Use `MICROCMS_SERVICE_DOMAIN` and `MICROCMS_API_KEY` from `.env`. Set
`MICROCMS_MANAGEMENT_API_KEY` when a separate key has API-information permission; otherwise the
checker reuses `MICROCMS_API_KEY`. Never expose either key to browser code or commit `.env`.

Declare required endpoints in `microcms/manifest.json`:

```json
{
  "endpoints": [
    {
      "name": "News",
      "endpoint": "news",
      "type": "list",
      "schema": "news.json",
      "fixtureCount": 20
    }
  ]
}
```

Place importable schema JSON under `microcms/schemas/`. Generate fields from the approved dynamic
content model, not from speculative future requirements.

Keep Markdown fallback entries under `content/dynamic/<endpoint>/`. List endpoints use one Markdown
file per item and must include at least `fixtureCount` plausible test items; object endpoints use
`index.md`. Pages must read through `src/lib/content/` so switching `CONTENT_SOURCE` does not change
component code.

As of the documented Management API checked for this starter, API operations expose
`GET /api/v1/apis` and `GET /api/v1/apis/{endpoint}` for list/schema inspection but no API creation
operation. Therefore:

1. Run `npm run microcms:check` to inspect permissions and existing schemas.
2. If all endpoints exist, validate field IDs and kinds and continue.
3. If endpoints are absent, give the user each generated schema file and the dashboard steps printed
   by the command. Pause for confirmation.
4. Re-run the command after manual import.
5. Only automate creation if current official microCMS documentation later exposes a supported
   writable endpoint. Never guess an undocumented HTTP method or route.
