# syntax=docker/dockerfile:1

# ---- deps: 의존성만 설치 (레이어 캐싱으로 재빌드 속도 확보) ----
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: Prisma Client 생성 + Next.js 빌드 ----
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# 빌드 시점엔 실제 DB에 연결하지 않지만, prisma.config.ts가 dotenv로 DATABASE_URL을 읽으므로
# 형식만 맞는 값이라도 있어야 `prisma generate`가 통과한다.
ENV DATABASE_URL="postgresql://user:password@localhost:5432/db"
RUN npx prisma generate
RUN npm run build

# ---- runner: standalone 산출물만 담아 이미지 최소화 ----
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
