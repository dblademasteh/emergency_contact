import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";
import { PhoneIcon } from "@/components/icons";

export default async function LoginPage() {
  const cookieStore = await cookies();
  if (verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value)) {
    redirect("/");
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-rose-500 via-red-600 to-red-800 text-white shadow-lg shadow-red-600/30">
          <PhoneIcon className="h-7 w-7" />
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-amber-400 ring-2 ring-white"
          />
        </div>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Admin sign in</h1>
        <p className="mt-1 text-sm text-slate-600">
          Enter the admin password to manage contacts.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <LoginForm />
      </div>

      <p className="mt-6 text-center text-xs text-slate-600">
        Public visitors can always view contacts without signing in.
      </p>
    </main>
  );
}
