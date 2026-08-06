import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Next.js dev 서버는 파일이 바뀔 때마다 모듈을 다시 로드하므로,
// 매번 새 PrismaClient를 만들면 커넥션이 쌓여 DB 커넥션 한도를 금방 채운다.
// globalThis에 캐싱해서 dev 중에는 하나의 인스턴스만 재사용한다.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
