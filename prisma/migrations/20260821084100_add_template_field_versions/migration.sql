-- CreateTable
CREATE TABLE "template_field_versions" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "fields" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_field_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "template_field_versions_templateId_idx" ON "template_field_versions"("templateId");

-- AddForeignKey
ALTER TABLE "template_field_versions" ADD CONSTRAINT "template_field_versions_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
