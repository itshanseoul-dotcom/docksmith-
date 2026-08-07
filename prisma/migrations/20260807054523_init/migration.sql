-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'CURRENCY');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerAuthUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "sourceFileUrl" TEXT NOT NULL,
    "pageCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_fields" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "FieldType" NOT NULL DEFAULT 'TEXT',
    "page" INTEGER NOT NULL DEFAULT 1,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "fontSize" DOUBLE PRECISION NOT NULL DEFAULT 10,

    CONSTRAINT "template_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generation_jobs" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "sourceFileName" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generation_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generation_job_items" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    "rowData" JSONB NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,

    CONSTRAINT "generation_job_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "column_alias_dictionary" (
    "id" TEXT NOT NULL,
    "canonicalKey" TEXT NOT NULL,
    "alias" TEXT NOT NULL,

    CONSTRAINT "column_alias_dictionary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_ownerAuthUserId_key" ON "organizations"("ownerAuthUserId");

-- CreateIndex
CREATE INDEX "templates_organizationId_idx" ON "templates"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "template_fields_templateId_key_key" ON "template_fields"("templateId", "key");

-- CreateIndex
CREATE INDEX "generation_jobs_templateId_idx" ON "generation_jobs"("templateId");

-- CreateIndex
CREATE INDEX "generation_job_items_jobId_idx" ON "generation_job_items"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "column_alias_dictionary_alias_key" ON "column_alias_dictionary"("alias");

-- CreateIndex
CREATE INDEX "column_alias_dictionary_canonicalKey_idx" ON "column_alias_dictionary"("canonicalKey");

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_fields" ADD CONSTRAINT "template_fields_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_job_items" ADD CONSTRAINT "generation_job_items_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "generation_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
