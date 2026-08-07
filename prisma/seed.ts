// 초기 컬럼-필드 동의어 딕셔너리 (ROADMAP 1.5). CSV 헤더가 여기 등록된 별칭과
// (정규화 후) 일치하면 자동으로 필드에 매칭된다. 실사용 데이터가 쌓이면서
// 계속 늘려가는 걸 전제로 하므로 지금은 물류 서류에서 자주 보이는 것만 담는다.
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const DICTIONARY: Record<string, string[]> = {
  invoice_no: ["Invoice No", "Invoice Number", "Invoice #", "Inv No"],
  invoice_date: ["Invoice Date", "Date", "Issue Date"],
  po_number: ["PO Number", "PO No", "Purchase Order Number", "PO#"],
  consignee: ["Consignee", "Ship To", "Buyer", "Recipient"],
  shipper: ["Shipper", "Seller", "Exporter", "Sender"],
  description: [
    "Description",
    "Item Description",
    "Product Description",
    "Goods Description",
  ],
  quantity: ["Quantity", "Qty", "Pieces"],
  unit_price: ["Unit Price", "Price", "Price per Unit"],
  amount: ["Amount", "Total", "Total Amount", "Line Total"],
  currency: ["Currency", "Curr"],
  weight: ["Weight", "Gross Weight", "Net Weight"],
  country_of_origin: ["Country of Origin", "Origin", "COO"],
  hs_code: ["HS Code", "HTS Code", "Tariff Code"],
  tracking_no: ["Tracking No", "Tracking Number", "AWB", "Air Waybill"],
};

async function main() {
  for (const [canonicalKey, aliases] of Object.entries(DICTIONARY)) {
    for (const alias of aliases) {
      await prisma.columnAlias.upsert({
        where: { alias },
        update: { canonicalKey },
        create: { canonicalKey, alias },
      });
    }
  }
  console.log(
    `seeded ${Object.values(DICTIONARY).flat().length} column aliases`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
