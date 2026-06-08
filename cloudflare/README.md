# Lead Webhook Cloudflare Worker

This Worker receives the lead payload from the simulator and forwards it to the
external Simulead webhook with the required Authorization header. After the
lead webhook succeeds, it also sends the same Lead event to Meta Conversions API.

Required secrets:

```bash
wrangler secret put LEAD_WEBHOOK_TOKEN
wrangler secret put META_CAPI_ACCESS_TOKEN
```

Required variables:

```bash
LEAD_WEBHOOK_URL=https://webhook.simulead.com.br/webhook/e4ce4839-bb0c-4ade-ac79-7f5325be5104
META_PIXEL_ID=1002345206086674
META_GRAPH_API_VERSION=v25.0
```

After deploying the Worker, set the site build variable:

```bash
VITE_FORM_WEBHOOK_PROXY_URL=https://<your-worker-url>
```

Deploy from this folder:

```bash
wrangler deploy
```
