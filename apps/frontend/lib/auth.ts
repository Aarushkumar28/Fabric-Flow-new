'use client';

import { createClient } from '@/utils/supabase/client';

let browserClient: ReturnType<typeof createClient> | null = null;

function getBrowserClient() {
  if (!browserClient) {
    browserClient = createClient();
  }

  return browserClient;
}

export async function getSupabaseSession() {
  const client = getBrowserClient();
  const { data, error } = await client.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

export async function getSupabaseAccessToken() {
  const session = await getSupabaseSession();
  return session?.access_token ?? null;
}

export async function signInWithSupabase(email: string, password: string) {
  const client = getBrowserClient();
  return client.auth.signInWithPassword({ email, password });
}

export async function signOutFromSupabase() {
  const client = getBrowserClient();
  return client.auth.signOut();
}

export function subscribeToAuthChanges(
  callback: Parameters<ReturnType<typeof createClient>['auth']['onAuthStateChange']>[0],
) {
  const client = getBrowserClient();
  return client.auth.onAuthStateChange(callback);
}
