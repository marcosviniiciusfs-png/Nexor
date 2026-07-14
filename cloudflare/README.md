# Lead Webhook Cloudflare Worker

This Worker receives the lead payload from the simulator and sends only the
Lead event to Meta Conversions API. It does not forward leads to Simulead, Hurtz
CRM, GitHub export, or KV storage.

Required secrets:

```bash
wrangler secret put META_CAPI_ACCESS_TOKEN
```

Required variables:

```bash
META_PIXEL_ID=1046333127914247
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
