"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, signup, signInWithGoogle, type AuthFormState } from "./actions";

const initialState: AuthFormState = undefined;

export function LoginForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginState, loginAction, loginPending] = useActionState(login, initialState);
  const [signupState, signupAction, signupPending] = useActionState(signup, initialState);

  const isSignup = mode === "signup";
  const action = isSignup ? signupAction : loginAction;
  const state = isSignup ? signupState : loginState;
  const pending = isSignup ? signupPending : loginPending;

  return (
    <div className="flex flex-col gap-4">
      <form action={signInWithGoogle}>
        <Button type="submit" size="lg" className="w-full">
          Google로 계속하기
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        또는
        <div className="h-px flex-1 bg-border" />
      </div>

      <form action={action} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">이메일</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">비밀번호</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete={isSignup ? "new-password" : "current-password"}
          />
        </div>
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        <Button type="submit" variant="outline" disabled={pending}>
          {isSignup ? "이메일로 가입하기" : "이메일로 로그인"}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => setMode(isSignup ? "login" : "signup")}
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        {isSignup ? "계정이 있으신가요? 로그인" : "계정이 없으신가요? 이메일로 가입"}
      </button>
    </div>
  );
}
