# HarbourWatch

## API secret setup

The Worker reads the AIS Stream key as `env.AISSTREAM_API_KEY`. Keep the real
value out of `worker.js`, `index.html`, and Git.

1. Copy `.env.example` to `.env` in this folder.
2. Put your AIS Stream API key after `AISSTREAM_API_KEY=` in `.env`.
3. Deploy the secret to Cloudflare from this folder:

```powershell
npx wrangler secret put AISSTREAM_API_KEY
```

When Wrangler prompts for the value, paste the same key from `.env`. The local
`.env` file is ignored by Git and is not uploaded to the Worker.