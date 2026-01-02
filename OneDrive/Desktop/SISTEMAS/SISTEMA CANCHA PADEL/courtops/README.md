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

## Deploy on Vercel (Production)

1. **Push to GitHub**: Make sure this code is in a GitHub repository.
2. **Import to Vercel**: Go to [vercel.com/new](https://vercel.com/new) and import your repository.
3. **Add Database**:
   - In the project configuration (or after deployment fails first time), go to the **Storage** tab.
   - Click "Connect Store" -> "Postgres".
   - Accept default settings to create the database.
   - Vercel will automatically add `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, etc., to your environment variables.
   
   **IMPORTANT**: You need to ensure the environment variable `DATABASE_URL` is set to the value of `POSTGRES_PRISMA_URL` (or `POSTGRES_URL_NON_POOLING`) in the settings if Vercel doesn't map it automatically. Usually, Vercel Postgres sets `POSTGRES_PRISMA_URL` which Prisma detects if configured, but our schema uses `DATABASE_URL`.
   - **Fix**: In Vercel Project Settings -> Environment Variables, create a new variable named `DATABASE_URL` and set its value to the same value as `POSTGRES_PRISMA_URL` (you can copy-paste it from the storage setup).

4. **Initialize Database**:
   - Vercel usually attempts to build, but you need to run migrations.
   - You can add a "build command" override: `prisma migrate deploy && next build`.
   - OR, purely for the first time, you can connect to the database locally (copying the connection string to your local `.env`) and run `npx prisma migrate deploy`.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
