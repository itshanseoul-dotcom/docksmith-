import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMembershipForUser, canManageTemplates } from "@/lib/membership";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UploadForm } from "./upload-form";

export default async function NewTemplatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const membership = await getMembershipForUser(user.id);
  if (membership && !canManageTemplates(membership.role)) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>새 템플릿 업로드</CardTitle>
          <CardDescription>
            PDF 원본 양식을 올리면 다음 단계(필드 매핑)에서 사용할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UploadForm />
        </CardContent>
      </Card>
    </div>
  );
}
