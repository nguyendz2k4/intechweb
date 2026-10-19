# Build from customer-owned configuration; database credentials are BuildKit secrets.
FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS builder
WORKDIR /app
COPY . .
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_STANDALONE=true
RUN --mount=type=secret,id=database_url,required=true \
    DATABASE_URL="$(cat /run/secrets/database_url)" npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nextjs && adduser --system --uid 1001 --ingroup nextjs nextjs
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nextjs /app/public ./public
RUN mkdir -p public/uploads/images public/uploads/datasheets .next/cache && chown -R nextjs:nextjs public/uploads .next/cache
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
