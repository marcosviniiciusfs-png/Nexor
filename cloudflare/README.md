# Lead Webhook Cloudflare Worker

This Worker receives the lead payload from the simulator and forwards it to the
external Simulead webhook with the required Authorization header.

Required secret for the webhook:

```bash
wrangler secret put LEAD_WEBHOOK_TOKEN
```

Required variable:

```bash
LEAD_WEBHOOK_URL=https://webhook.simulead.com.br/webhook/e4ce4839-bb0c-4ade-ac79-7f5325be5104
```

After deploying the Worker, set the site build variable:

```bash
VITE_FORM_WEBHOOK_PROXY_URL=https://<your-worker-url>
```

Deploy from this folder:

```bash
wrangler deploy
```
