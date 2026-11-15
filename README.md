This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Image storage (Cloudflare R2)

Nazo images are uploaded from the admin form directly to Cloudflare R2 using a presigned URL
(`app/api/upload/route.ts`). Before upload, the browser resizes them to a max of 1600px and converts them to WebP (`lib/upload-image.ts`).

Environment variables:

```
R2_ACCOUNT_ID=...          # Cloudflare account ID
R2_ACCESS_KEY_ID=...       # R2 API token (Object Read & Write, scoped to the bucket)
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=nazo-space-images
R2_PUBLIC_URL=https://img.example.com   # custom domain (or r2.dev URL) connected to the bucket
```

The bucket needs this CORS policy so the browser can PUT to it and read images (for share cards):

```json
[
  {
    "AllowedOrigins": ["https://<your-domain>", "http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["content-type", "cache-control"],
    "MaxAgeSeconds": 3600
  }
]
```

To migrate existing Vercel Blob images:

```
pnpm migrate:images            # dry run: shows what would change and the size savings
pnpm migrate:images --apply    # upload to R2 and rewrite nazo.imageUrl in MongoDB
```

The old blobs are not deleted. Remove them from the Vercel dashboard once you have checked the migration.

### Hardening checklist (Cloudflare dashboard)

R2 has no hard spending limit, so make sure abusive traffic gets served from the CDN cache instead of hitting the bucket:

- **Public access:** serve images only through the custom domain. Keep the `r2.dev` URL **disabled**.
- **Cache rule** for the image hostname: *Eligible for cache*, Edge TTL 1 year, **Cache key → ignore query string**. Otherwise `?random=123` bypasses the cache and every request becomes a billed R2 read.
- **Cache 404s:** in the same rule, set an Edge TTL for status `404` (e.g. 1 hour). This stops requests for random, nonexistent keys from reaching R2 every time.
- **Rate limiting rule** (WAF → Rate limiting) on the image hostname, e.g. 300 requests / 10s per IP → block.
- **API token** scoped to *Object Read & Write* on this bucket only, stored only in Vercel env vars.
- **Billing notifications** (Manage Account → Notifications → Billing/usage) so you get an email if usage spikes.
