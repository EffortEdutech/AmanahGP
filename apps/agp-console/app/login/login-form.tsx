"use client";

import { useState } from "react";
import { loginAction } from "@/app/login/actions";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={loginAction} className="stack">
      <div className="field">
        <label htmlFor="email">Email</label>
        <input className="input" id="email" name="email" type="email" required />
      </div>

      <div className="field">
        <label htmlFor="password">Password</label>
        <div className="relative">
          <input className="input pr-11" id="password" name="password" type={showPassword ? "text" : "password"} required />

          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((value) => !value)}
            className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-slate-500 hover:text-emerald-700"
          >
            <PasswordEye open={showPassword} />
          </button>
        </div>
      </div>

      <button className="btn btn-primary" type="submit">Sign in</button>
    </form>
  );
}

function PasswordEye({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.7A3 3 0 0 0 13.4 13.5" />
      <path d="M9.9 5.2A11.2 11.2 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-4.2 4.8" />
      <path d="M6.6 6.7C4.1 8.4 2.5 12 2.5 12S6 19 12 19c1.8 0 3.4-.4 4.8-1.1" />
    </svg>
  );
}
