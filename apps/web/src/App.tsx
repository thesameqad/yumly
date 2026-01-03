import React, { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import type {
  ChatMessage as ChatMessageType,
  Place,
  LLMModelKey,
  EmbeddingProvider,
} from "@yumly/shared";
import { sendMessage } from "./api";
import { useLocation } from "./hooks/useLocation";
import { ChatMessage } from "./components/ChatMessage";
import { ChatInput } from "./components/ChatInput";
import { ModelSelector } from "./components/ModelSelector";
import { LocationButton } from "./components/LocationButton";

interface DisplayMessage extends ChatMessageType {
  places?: Place[];
}

function App() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<LLMModelKey>("GPT");
  const [selectedEmbedding, setSelectedEmbedding] =
    useState<EmbeddingProvider>("openai");

  const {
    location,
    error: locationError,
    loading: locationLoading,
    requestLocation,
  } = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Add welcome message on mount
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          '👋 Hi! I\'m **Yumly**, your AI dining assistant. I can help you find great restaurants, cafes, and bars anywhere in the USA.\n\nTry asking me things like:\n- "Best pizza places near me"\n- "I want to eat tiramisu"\n- "Cozy coffee shops for working"\n- "Where should I get brunch?"\n\n📍 **Tip:** Share your location for personalized nearby recommendations!',
        timestamp: Date.now(),
      },
    ]);
  }, []);

  const handleSend = async (content: string) => {
    // Add user message immediately
    const userMsg: DisplayMessage = {
      id: uuidv4(),
      role: "user",
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await sendMessage({
        message: content,
        userId: userId || undefined,
        location: location || undefined,
        selectedModel,
        selectedEmbedding,
      });

      // Store userId for subsequent messages
      if (!userId) {
        setUserId(response.userId);
      }

      // Add assistant response
      const assistantMsg: DisplayMessage = {
        id: uuidv4(),
        role: "assistant",
        content: response.message,
        timestamp: Date.now(),
        places: response.places,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMsg: DisplayMessage = {
        id: uuidv4(),
        role: "assistant",
        content:
          "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yum-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">Y</span>
          </div>
          <div>
            <h1 className="font-bold text-xl text-gray-900">Yumly</h1>
            <p className="text-xs text-gray-500">AI Dining Assistant</p>
          </div>
        </div>

        <LocationButton
          location={location}
          loading={locationLoading}
          error={locationError}
          onRequestLocation={requestLocation}
        />
      </header>

      {/* Model selector */}
      <ModelSelector
        selectedModel={selectedModel}
        selectedEmbedding={selectedEmbedding}
        onModelChange={setSelectedModel}
        onEmbeddingChange={setSelectedEmbedding}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} places={msg.places} />
          ))}

          {loading && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="max-w-3xl mx-auto w-full">
        <ChatInput onSend={handleSend} disabled={loading} />
      </div>
    </div>
  );
}

export default App;
