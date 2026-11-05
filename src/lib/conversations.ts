import { ChatConversationSummary, ChatCropSummary, StoredChatMessage } from '@/types/chat';

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: 'same-origin',
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || `Conversation request failed (${response.status}).`);
  }
  return result as T;
}

export async function listCrops(): Promise<ChatCropSummary[]> {
  const result = await requestJson<{ crops: ChatCropSummary[] }>('/api/crops');
  return result.crops;
}

export async function createCropConversation(
  cropName: string,
  title: string
): Promise<ChatConversationSummary> {
  const result = await requestJson<{ conversation: ChatConversationSummary }>('/api/crops', {
    method: 'POST',
    body: JSON.stringify({ cropName, title }),
  });
  return result.conversation;
}

export async function loadConversationMessages(
  cropId: string,
  conversationId: string
): Promise<StoredChatMessage[]> {
  const result = await requestJson<{ messages: StoredChatMessage[] }>(
    `/api/crops/${encodeURIComponent(cropId)}/conversations/${encodeURIComponent(conversationId)}/messages`
  );
  return result.messages;
}

export async function saveConversationMessage(
  cropId: string,
  conversationId: string,
  message: StoredChatMessage
): Promise<void> {
  await requestJson(
    `/api/crops/${encodeURIComponent(cropId)}/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
    method: 'POST',
    body: JSON.stringify({ message }),
    }
  );
}