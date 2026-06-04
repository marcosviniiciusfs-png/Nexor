# Meta CAPI Cloudflare Worker

This Worker receives the lead payload from the simulator, forwards it to the
external CRM webhook, and sends the server-side `Lead` event to Meta Conversions
API when the Meta token is configured.

Required secrets for the CRM webhook:

```bash
wrangler secret put LEAD_WEBHOOK_URL
wrangler secret put LEAD_WEBHOOK_TOKEN
```

Optional secret for Meta Conversions API:

```bash
wrangler secret put META_CAPI_ACCESS_TOKEN
```

Optional variables:

```bash
META_PIXEL_ID=2864957293877250
META_GRAPH_API_VERSION=v25.0
META_TEST_EVENT_CODE=<Meta test event code>
```

After deploying the Worker, set the site build variable:

```bash
VITE_FORM_WEBHOOK_PROXY_URL=https://<your-worker-url>
```

Deploy from this folder:

```bash
wrangler deploy
```
