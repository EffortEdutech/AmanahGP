'use server';
// apps/admin/app/(auth)/actions.ts
// AmanahHub Console — Auth server actions

import { redirect }       from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient }   from '@/lib/supabase/server';
import { signInSchema, signUpSchema, forgotPasswordSchema } from '@agp/validation';

// ── Sign In ───────────────────────────────────────────────────
export async function signIn(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const raw = {
    email:    formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid input' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (error.message.includes('Invalid login')) {
      return { error: 'Incorrect email or password' };
    }
    return { error: error.message };
  }

  const next = formData.get('next') as string | null;
  redirect(next ?? '/dashboard');
}

// ── Sign Up ───────────────────────────────────────────────────
export async function signUp(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const raw = {
    email:       formData.get('email') as string,
    password:    formData.get('password') as string,
    displayName: formData.get('displayName') as string,
  };

  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid input' };
  }

  const supabase = await createClient();
  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3201';

  const { error } = await supabase.auth.signUp({
    email:    parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${appUrl}/callback`,
      data: {
        display_name:  parsed.data.displayName ?? '',
        platform_role: 'donor', // Default; super_admin assigns elevated roles
      },
    },
  });

  if (error) return { error: error.message };
  return { success: true };
}

// ── Sign Out ──────────────────────────────────────────────────
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

// ── Forgot Password ───────────────────────────────────────────
export async function forgotPassword(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const raw = { email: formData.get('email') as string };

  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) return { error: 'Please enter a valid email address' };

  const supabase = await createClient();
  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3201';

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${appUrl}/callback?type=recovery`,
  });

  if (error) return { error: error.message };
  return { success: true };
}
