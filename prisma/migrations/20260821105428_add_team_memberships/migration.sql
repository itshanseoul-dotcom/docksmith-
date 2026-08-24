-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateTable
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "authUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'OWNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_invites" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'MEMBER',
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "organization_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "memberships_authUserId_key" ON "memberships"("authUserId");

-- CreateIndex
CREATE INDEX "memberships_organizationId_idx" ON "memberships"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_invites_token_key" ON "organization_invites"("token");

-- CreateIndex
CREATE INDEX "organization_invites_organizationId_idx" ON "organization_invites"("organizationId");

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_invites" ADD CONSTRAINT "organization_invites_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: every existing organization already has exactly one owner
-- (ownerAuthUserId was unique pre-Membership). organizations.name was always
-- set to that owner's email at creation, so it doubles as the email to store here.
INSERT INTO "memberships" ("id", "organizationId", "authUserId", "email", "role", "createdAt")
SELECT substr(md5(random()::text || clock_timestamp()::text), 1, 25),
       "id",
       "ownerAuthUserId",
       "name",
       'OWNER',
       "createdAt"
FROM "organizations";
