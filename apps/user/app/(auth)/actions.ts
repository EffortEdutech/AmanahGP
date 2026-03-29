'use server';
// apps/user/app/(auth)/actions.ts
// AmanahHub — Auth server actions (updated: adds resetPassword)

import { redirect }     from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { signInSchema, signUpSchema, forgotPasswordSchema, resetPasswordSchema } from '@agp/validation';

export async function signIn(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const parsed = signInSchema.safeParse({
    email:    formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid input' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: 'Incorrect email or password' };

  const next = formData.get('next') as string | null;
  redirect(next ?? '/');
}

export async function signUp(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const parsed = signUpSchema.safeParse({
    email:       formData.get('email'),
    password:    formData.get('password'),
    displayName: formData.get('displayName'),
  });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid input' };

  const supabase = await createClient();
  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3300';

  const { error } = await supabase.auth.signUp({
    email:    parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${appUrl}/callback`,
      data: { display_name: parsed.data.displayName ?? '' },
    },
  });
  if (error) return { error: error.message };
  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

export async function forgotPassword(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) return { error: 'Please enter a valid email address' };

  const supabase = await createClient();
  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3300';

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${appUrl}/callback?type=recovery`,
  });
  if (error) return { error: error.message };
  return { success: true };
}

export async function resetPassword(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const parsed = resetPasswordSchema.safeParse({
    password:        formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid input' };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };
  return { success: true };
}
