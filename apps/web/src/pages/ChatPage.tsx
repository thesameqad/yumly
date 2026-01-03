import React, { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useLocation as useRouteLocation } from "react-router-dom";
import type {
  ChatMessage as ChatMessageType,
  Place,
  LLMModelKey,
  EmbeddingProvider,
} from "@yumly/shared";
import { sendMessage } from "../api";
import { useLocation } from "../hooks/useLocation";
import { ChatMessage } from "../components/ChatMessage";
import { ChatInput } from "../components/ChatInput";
import { ModelSelector } from "../components/ModelSelector";
import { LocationButton } from "../components/LocationButton";
import { UtensilsCrossed } from "lucide-react";
import { Link } from "react-router-dom";

interface DisplayMessage extends ChatMessageType {
  places?: Place[];
}

export function ChatPage() {
  const routeLocation = useRouteLocation();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<LLMModelKey>("GPT");
  const [selectedEmbedding, setSelectedEmbedding] =
    useState<EmbeddingProvider>("openai");

  const {
    location,
    cityName,
    error: locationError,
    loading: locationLoading,
    ready: locationReady,
    requestLocation,
  } = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const pendingInitialMessage = useRef<string | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle initial message from landing page
  useEffect(() => {
    if (initialized.current) return;

    const initialMessage = routeLocation.state?.initialMessage;

    if (initialMessage) {
      // Store the message to send once location is ready
      pendingInitialMessage.current = initialMessage;
      initialized.current = true;
    } else {
      initialized.current = true;
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content:
            '👋 Hi! I\'m **Yumly**, your AI dining assistant. I can help you find great restaurants, cafes, and bars anywhere in the USA.\n\nTry asking me things like:\n- "Best pizza places near me"\n- "I want to eat tiramisu"\n- "Cozy coffee shops for working"\n- "Where should I get brunch?"\n\n📍 **Tip:** Share your location for personalized nearby recommendations!',
          timestamp: Date.now(),
        },
      ]);
    }
  }, []);

  // Send pending initial message once location check is complete
  useEffect(() => {
    if (pendingInitialMessage.current && locationReady) {
      const message = pendingInitialMessage.current;
      pendingInitialMessage.current = null;
      handleSend(message);
    }
  }, [locationReady]);

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
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm z-10">
        <Link
          to="/"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-yum-500 to-yum-600 rounded-xl flex items-center justify-center shadow-lg shadow-yum-200">
            <UtensilsCrossed className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-xl text-gray-900 tracking-tight">
              Yumly
            </h1>
            <p className="text-xs text-yum-600 font-medium">
              AI Dining Assistant
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <LocationButton
            location={location}
            cityName={cityName}
            loading={locationLoading}
            error={locationError}
            onRequestLocation={requestLocation}
          />
        </div>
      </header>

      {/* Model selector */}
      <div className="bg-white border-b px-6 py-2">
        <ModelSelector
          selectedModel={selectedModel}
          selectedEmbedding={selectedEmbedding}
          onModelChange={setSelectedModel}
          onEmbeddingChange={setSelectedEmbedding}
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} places={msg.places} />
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl rounded-bl-none px-6 py-4 shadow-sm border border-gray-100">
                <div className="flex gap-1.5">
                  <span
                    className="w-2 h-2 bg-yum-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-yum-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-yum-400 rounded-full animate-bounce"
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
      <div className="p-4 bg-white border-t">
        <div className="max-w-4xl mx-auto w-full">
          <ChatInput onSend={handleSend} disabled={loading} />
          <div className="flex justify-center mt-2">
            <a
              href="https://www.yelp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity"
            >
              <span className="text-[10px] text-gray-500 font-medium">
                Powered by
              </span>
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/a/ad/Yelp_Logo.svg"
                alt="Yelp"
                className="h-4"
              />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
