"use client";

import { useState } from "react";
import { LoginForm } from "@/components/login-form";
import { RegisterForm } from "@/components/register-form";

type Mode = "signin" | "register";

export function AuthTabs() {
  const [mode, setMode] = useState<Mode>("signin");

  return (
    <div>
      <div
        role="tablist"
        aria-label="Account access"
        className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signin"}
          onClick={() => setMode("signin")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
            mode === "signin"
              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "register"}
          onClick={() => setMode("register")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
            mode === "register"
              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Create account
        </button>
      </div>

      {mode === "signin" ? <LoginForm /> : <RegisterForm />}
    </div>
  );
}
