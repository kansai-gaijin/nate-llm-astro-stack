---
siteName: Example Site
referenceUrl: https://example.com
referencePages:
  - id: home
    url: https://example.com
    targetRoute: /
    primary: true
locale: ja
pages:
  - path: /
    file: home.md
    title: Home
microcms:
  required: false
  endpoints: []
  env:
    serviceDomain: MICROCMS_SERVICE_DOMAIN
    contentApiKey: MICROCMS_API_KEY
    managementApiKey: MICROCMS_MANAGEMENT_API_KEY
---

# Website overview

Replace this file with the website purpose, audience, design constraints, and sitemap.

The `referenceUrl` and primary `referencePages` entry define the most important top-page clone.
Add only the reference subpage URLs the user explicitly wants cloned; the loop does not crawl other
reference pages. Each reference page maps to a sitemap `targetRoute`. Each `pages` entry maps a final
route to Markdown under `content/pages/`. Only sitemap routes are required.
