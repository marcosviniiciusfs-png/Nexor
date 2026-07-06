# Lead Webhook Cloudflare Worker

This Worker receives the lead payload from the simulator and forwards it to the
external Simulead webhook with the required Authorization header. It can also
fan out the same complete payload to the Hurtz CRM webhook and, after the lead
webhooks succeed, queue a JSON copy of the lead for GitHub export. The Worker
then triggers a GitHub Action immediately through `repository_dispatch`, and the
Action commits the JSON files to this repository. After those steps succeed, it
sends the same Lead event to Meta Conversions API.

Required secrets:

```bash
wrangler secret put LEAD_WEBHOOK_TOKEN
wrangler secret put HURTZ_CRM_WEBHOOK_SECRET
wrangler secret put LEAD_EXPORT_TOKEN
wrangler secret put GITHUB_DISPATCH_TOKEN
wrangler secret put META_CAPI_ACCESS_TOKEN
```

Required variables:

```bash
LEAD_WEBHOOK_URL=https://webhook.simulead.com.br/webhook/e4ce4839-bb0c-4ade-ac79-7f5325be5104
HURTZ_CRM_WEBHOOK_URL=https://crm.hurtzcompany.com.br/webhooks/lead_forms/kVKxfWju8fYi8CXArWTwkP1B
GITHUB_DISPATCH_REPOSITORY=marcosviniiciusfs-png/grupo-uniao
GITHUB_DISPATCH_EVENT=lead-created
GITHUB_LEADS_DIRECTORY=leads-cadastrados
META_PIXEL_ID=1002345206086674
META_GRAPH_API_VERSION=v25.0
```

Required bindings:

```toml
[[kv_namespaces]]
binding = "LEADS_KV"
```

After deploying the Worker, set the site build variable:

```bash
VITE_FORM_WEBHOOK_PROXY_URL=https://<your-worker-url>
```

Deploy from this folder:

```bash
wrangler deploy
```
