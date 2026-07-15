# Lead Webhook Cloudflare Worker

This Worker receives the lead payload from the simulator, sends the Lead event
to Meta Conversions API, and immediately archives the accepted lead as JSON in
the Nexor GitHub repository under `leads-cadastrados/YYYY-MM-DD/`.

Required secrets:

```bash
wrangler secret put META_CAPI_ACCESS_TOKEN
wrangler secret put GITHUB_LEADS_TOKEN
```

Required variables:

```bash
META_PIXEL_ID=1046333127914247
META_GRAPH_API_VERSION=v25.0
GITHUB_LEADS_OWNER=marcosviniiciusfs-png
GITHUB_LEADS_REPO=Nexor
GITHUB_LEADS_BRANCH=main
GITHUB_LEADS_DIR=leads-cadastrados
```

After deploying the Worker, set the site build variable:

```bash
VITE_FORM_WEBHOOK_PROXY_URL=https://<your-worker-url>
```

Deploy from this folder:

```bash
wrangler deploy
```
