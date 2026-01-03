import type {
  ChatRequest,
  ChatResponse,
  UserSession,
  ChatMessage,
} from "@yumly/shared";

const API_BASE = "/api";

export async function sendMessage(request: ChatRequest): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export async function getSession(userId: string): Promise<UserSession | null> {
  const response = await fetch(`${API_BASE}/session/${userId}`);

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`API error: ${response.status}`);

  return response.json();
}

export async function getChatHistory(
  userId: string,
  limit = 50
): Promise<ChatMessage[]> {
  const response = await fetch(`${API_BASE}/history/${userId}?limit=${limit}`);

  if (!response.ok) throw new Error(`API error: ${response.status}`);

  const data = await response.json();
  return data.messages;
}

export async function clearChatHistory(userId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/history/${userId}`, {
    method: "DELETE",
  });

  if (!response.ok) throw new Error(`API error: ${response.status}`);
}

export async function updateLocation(
  userId: string,
  location: { latitude: number; longitude: number }
): Promise<void> {
  const response = await fetch(`${API_BASE}/location`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, location }),
  });

  if (!response.ok) throw new Error(`API error: ${response.status}`);
}
