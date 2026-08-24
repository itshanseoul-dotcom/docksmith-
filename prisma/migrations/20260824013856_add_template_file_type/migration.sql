-- CreateEnum
CREATE TYPE "TemplateFileType" AS ENUM ('PDF', 'DOCX', 'XLSX');

-- AlterTable
ALTER TABLE "template_fields" ALTER COLUMN "x" DROP NOT NULL,
ALTER COLUMN "y" DROP NOT NULL,
ALTER COLUMN "width" DROP NOT NULL,
ALTER COLUMN "height" DROP NOT NULL;

-- AlterTable
ALTER TABLE "templates" ADD COLUMN     "fileType" "TemplateFileType" NOT NULL DEFAULT 'PDF';
