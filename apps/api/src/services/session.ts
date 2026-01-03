import { v4 as uuidv4 } from "uuid";
import type {
  ChatMessage,
  UserSession,
  UserLocation,
  LLMModelKey,
  EmbeddingProvider,
} from "@yumly/shared";

// In-memory storage (resets on server restart)
const sessions = new Map<string, UserSession>();
const chatHistory = new Map<string, ChatMessage[]>();

const MAX_HISTORY_LENGTH = 50;

export class SessionService {
  // === Session Management ===

  createSession(): UserSession {
    const userId = uuidv4();
    const session: UserSession = {
      userId,
      selectedModel: "GPT",
      selectedEmbedding: "openai",
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    };

    sessions.set(userId, session);
    chatHistory.set(userId, []);

    return session;
  }

  getSession(userId: string): UserSession | null {
    const session = sessions.get(userId);
    if (!session) return null;

    // Update last active
    session.lastActiveAt = Date.now();
    return session;
  }

  updateSession(userId: string, updates: Partial<UserSession>): void {
    const session = sessions.get(userId);
    if (!session) return;

    if (updates.selectedModel) {
      session.selectedModel = updates.selectedModel;
    }
    if (updates.selectedEmbedding) {
      session.selectedEmbedding = updates.selectedEmbedding;
    }
    if (updates.location) {
      session.location = updates.location;
    }

    session.lastActiveAt = Date.now();
  }

  // === Chat History ===

  addMessage(userId: string, message: ChatMessage): void {
    let history = chatHistory.get(userId);
    if (!history) {
      history = [];
      chatHistory.set(userId, history);
    }

    history.push(message);

    // Trim if too long
    if (history.length > MAX_HISTORY_LENGTH) {
      chatHistory.set(userId, history.slice(-MAX_HISTORY_LENGTH));
    }
  }

  getChatHistory(userId: string, limit: number = 20): ChatMessage[] {
    const history = chatHistory.get(userId) || [];
    return history.slice(-limit);
  }

  clearChatHistory(userId: string): void {
    chatHistory.set(userId, []);
  }

  // === Location ===

  updateLocation(userId: string, location: UserLocation): void {
    this.updateSession(userId, { location });
  }

  getLocation(userId: string): UserLocation | null {
    const session = this.getSession(userId);
    return session?.location || null;
  }
}

// Singleton instance
export const sessionService = new SessionService();
