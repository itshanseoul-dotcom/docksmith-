import Link from "next/link";
import type { Metadata } from "next";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Commercial Invoice 생성기 — 500장을 30초에 | Docksmith",
  description:
    "쓰던 Commercial Invoice PDF 양식에 필드만 한 번 표시해두면, 다음부터는 CSV만 올려서 수백 장을 한 번에 만듭니다.",
};

const STEPS = [
  { title: "1. PDF 업로드", description: "쓰던 Commercial Invoice 양식을 그대로 올립니다." },
  { title: "2. 필드 클릭 매핑", description: "값이 들어갈 자리를 클릭·드래그로 한 번만 표시합니다." },
  {
    title: "3. CSV 업로드 → 다운로드",
    description: "행마다 채워진 PDF 수백 장이 ZIP으로 바로 다운로드됩니다.",
  },
];

const FAQS = [
  {
    q: "제 데이터는 어디에 저장되나요?",
    a: "CSV에 들어있는 실제 데이터는 브라우저에서만 처리되고, 서버로 전송되거나 저장되지 않습니다.",
  },
  {
    q: "무료인가요?",
    a: "지금 단계에서는 전부 무료로 쓸 수 있습니다.",
  },
  {
    q: "기존에 쓰던 PDF 양식이 있는데 그대로 써도 되나요?",
    a: "네, 지금 쓰시는 Commercial Invoice PDF를 그대로 올려서 필드만 표시하면 됩니다.",
  },
];

function CtaButton({ className }: { className?: string }) {
  return (
    <Link
      href="/login"
      className={buttonVariants({ variant: "default", size: "lg", className })}
    >
      무료로 시작하기
    </Link>
  );
}

export default function CommercialInvoiceGeneratorPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex justify-end p-4">
        <Link
          href="/login"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          로그인
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-16 px-6 py-12">
        <section className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Commercial Invoice, 30초에 500장 만들기
          </h1>
          <p className="max-w-md text-muted-foreground">
            매번 엑셀에서 하나씩 복사해 붙여넣던 반복 작업을, 한 번 설정해두면 CSV
            업로드만으로 끝냅니다.
          </p>
          <CtaButton />
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>지금까지</CardTitle>
              <CardDescription>
                엑셀에서 복사 → 문서에 붙여넣기 → 저장, 한 건마다 반복
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="ring-primary/40">
            <CardHeader>
              <CardTitle>Docksmith로</CardTitle>
              <CardDescription>CSV 한 번 업로드 → 전체 다운로드, 3초</CardDescription>
            </CardHeader>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STEPS.map((step) => (
            <Card key={step.title}>
              <CardHeader>
                <CardTitle className="text-base">{step.title}</CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-center text-lg font-medium">자주 묻는 질문</h2>
          {FAQS.map((item) => (
            <details key={item.q} className="rounded-lg border p-4">
              <summary className="cursor-pointer text-sm font-medium">{item.q}</summary>
              <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </section>

        <section className="flex flex-col items-center gap-4 text-center">
          <p className="text-muted-foreground">지금 바로 첫 템플릿을 만들어보세요.</p>
          <CtaButton />
        </section>
      </main>
    </div>
  );
}
