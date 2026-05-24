import { supabase, isSupabaseReady } from '../lib/supabase';
import type {
  PlanningAspect,
  ChatMessage,
  TripContext,
  AIChatResponse,
} from '../types/ai';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const CACHE_PREFIX = 'ai_cache_';
const CACHE_TTL = 5 * 60 * 1000;

function getCacheKey(messages: Array<{ role: string; content: string }>, aspect: string): string {
  const last = messages[messages.length - 1]?.content || '';
  return CACHE_PREFIX + aspect + '_' + btoa(encodeURIComponent(last)).slice(0, 40);
}

function getCached(key: string): AIChatResponse | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) {
      sessionStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setCache(key: string, data: AIChatResponse) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // storage full -- ignore
  }
}

export async function validateApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (response.ok) return { valid: true };
    if (response.status === 401) return { valid: false, error: 'Invalid API key' };
    return { valid: false, error: `Validation failed (${response.status})` };
  } catch {
    return { valid: false, error: 'Network error during validation' };
  }
}

export async function sendChatMessage(
  messages: Array<{ role: string; content: string }>,
  aspect: PlanningAspect,
  tripContext: TripContext | null,
  apiKey?: string,
): Promise<AIChatResponse> {
  const cacheKey = getCacheKey(messages, aspect);
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const url = `${SUPABASE_URL}/functions/v1/ai-planning`;
  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      messages,
      aspect,
      stream: false,
      apiKey: apiKey || undefined,
      tripContext,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }

  const result: AIChatResponse = {
    message: data.message,
    model: data.model || '',
    tokens: data.tokens || 0,
    success: true,
  };

  setCache(cacheKey, result);
  return result;
}

export async function streamChatMessage(
  messages: Array<{ role: string; content: string }>,
  aspect: PlanningAspect,
  tripContext: TripContext | null,
  onChunk: (text: string) => void,
  apiKey?: string,
): Promise<{ model: string; fullText: string }> {
  const url = `${SUPABASE_URL}/functions/v1/ai-planning`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      messages,
      aspect,
      stream: true,
      apiKey: apiKey || undefined,
      tripContext,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({ error: 'Stream request failed' }));
    throw new Error(errData.error || `Stream request failed (${response.status})`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  let model = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const payload = trimmed.slice(6);
      if (payload === '[DONE]') continue;

      try {
        const parsed = JSON.parse(payload);
        if (parsed.error) throw new Error(parsed.error);
        if (parsed.content) {
          fullText += parsed.content;
          onChunk(parsed.content);
        }
        if (parsed.model) model = parsed.model;
      } catch {
        // skip malformed
      }
    }
  }

  return { model, fullText };
}

export async function saveChatMessage(
  userId: string,
  sessionId: string,
  msg: Pick<ChatMessage, 'role' | 'content' | 'model_used' | 'tokens_used'>,
) {
  if (!isSupabaseReady || !supabase) return;
  await supabase.from('chat_messages').insert({
    user_id: userId,
    session_id: sessionId,
    role: msg.role,
    content: msg.content,
    model_used: msg.model_used,
    tokens_used: msg.tokens_used,
  });
}

export async function loadChatHistory(
  userId: string,
  sessionId: string,
): Promise<ChatMessage[]> {
  if (!isSupabaseReady || !supabase) return [];
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    role: row.role as 'user' | 'assistant',
    content: row.content,
    model_used: row.model_used || '',
    aspect: 'strategic' as PlanningAspect,
    tokens_used: row.tokens_used || 0,
    created_at: row.created_at,
  }));
}

export async function saveUserApiKey(userId: string, encryptedKey: string) {
  if (!isSupabaseReady || !supabase) return;
  const { data } = await supabase
    .from('user_settings')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (data) {
    await supabase
      .from('user_settings')
      .update({ openai_api_key_encrypted: encryptedKey })
      .eq('user_id', userId);
  } else {
    await supabase.from('user_settings').insert({
      user_id: userId,
      openai_api_key_encrypted: encryptedKey,
    });
  }
}

export async function loadUserApiKey(userId: string): Promise<string> {
  if (!isSupabaseReady || !supabase) return '';
  const { data } = await supabase
    .from('user_settings')
    .select('openai_api_key_encrypted')
    .eq('user_id', userId)
    .maybeSingle();

  return data?.openai_api_key_encrypted || '';
}

export async function removeUserApiKey(userId: string) {
  if (!isSupabaseReady || !supabase) return;
  await supabase
    .from('user_settings')
    .update({ openai_api_key_encrypted: '' })
    .eq('user_id', userId);
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = 3,
): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const response = await fetch(url, init);

    if (response.status === 429 && attempt < retries - 1) {
      const delay = Math.pow(2, attempt + 1) * 1000;
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }

    if (response.status >= 500 && attempt < retries - 1) {
      await new Promise((r) => setTimeout(r, 2000));
      continue;
    }

    return response;
  }

  return fetch(url, init);
}

export function encryptApiKey(key: string): string {
  return btoa(key);
}

export function decryptApiKey(encrypted: string): string {
  try {
    return atob(encrypted);
  } catch {
    return '';
  }
}

export function estimateCost(tokens: number, model: string): number {
  const rates: Record<string, number> = {
    'gpt-4o': 0.005 / 1000,
    'gpt-4o-mini': 0.00015 / 1000,
  };
  return tokens * (rates[model] || rates['gpt-4o-mini']);
}
