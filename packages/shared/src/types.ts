// LLM Models available via OpenRouter
export const LLM_MODELS = {
  GPT: "openai/gpt-4o-mini",
  CLAUDE: "anthropic/claude-3-5-sonnet",
  GEMINI: "google/gemini-2.0-flash-exp",
  GROK: "x-ai/grok-beta",
  MISTRAL: "mistralai/mistral-small",
  LLAMA: "meta-llama/llama-3.1-70b-instruct",
  DEEPSEEK: "deepseek/deepseek-chat",
  QWEN: "qwen/qwen-2.5-72b-instruct",
} as const;

export type LLMModelKey = keyof typeof LLM_MODELS;
export type LLMModelId = (typeof LLM_MODELS)[LLMModelKey];

// Embedding providers
export const EMBEDDING_PROVIDERS = {
  OPENAI: "openai",
  VOYAGE: "voyage",
  JINA: "jina",
  COHERE: "cohere",
} as const;

export type EmbeddingProvider =
  (typeof EMBEDDING_PROVIDERS)[keyof typeof EMBEDDING_PROVIDERS];

// Chat message types
export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

// User location
export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

// User session/preferences
export interface UserSession {
  userId: string;
  selectedModel: LLMModelKey;
  selectedEmbedding: EmbeddingProvider;
  location?: UserLocation;
  createdAt: number;
  lastActiveAt: number;
}

// Intent types from LLM router
export type IntentType =
  | "search_places"
  | "get_recommendations"
  | "filter_results"
  | "place_details"
  | "general_chat";

// Sorting options for Yelp search
export type SortBy = "best_match" | "rating" | "review_count" | "distance";

// Yelp attributes (free tier only)
export interface PlaceAttributes {
  wheelchairAccessible?: boolean;
  genderNeutralRestrooms?: boolean;
  openToAll?: boolean;
  dogsAllowed?: boolean;
}

export interface ParsedIntent {
  intent: IntentType;
  entities: {
    cuisine?: string;
    placeType?: "restaurant" | "cafe" | "bar" | "any";
    dish?: string;
    filters?: PlaceFilters;
    attributes?: PlaceAttributes;
    sortBy?: SortBy;
    query?: string;
    location?: string; // Extracted location from query (e.g., "Frisco", "downtown Austin")
    placeName?: string; // Specific place name for place_details intent
    needsUserLocation?: boolean; // True if query implies "near me" without specifying location
  };
  confidence: number;
}

// Place/Restaurant types
export interface PlaceFilters {
  openNow?: boolean;
  priceLevel?: number[]; // 1-4 ($, $$, $$$, $$$$)
  rating?: number; // minimum rating
  distance?: number; // max distance in meters
}

export interface Place {
  id: string;
  name: string;
  categories: string[];
  rating?: number;
  reviewCount?: number;
  priceLevel?: string; // $, $$, $$$, $$$$
  address: string;
  city: string;
  phone?: string;
  distance?: number; // meters from user
  coordinates: {
    latitude: number;
    longitude: number;
  };
  isOpenNow?: boolean;
  hours?: DayHours[];
  imageUrl?: string;
  url?: string;
  menuUrl?: string; // Link to menu
}

export interface DayHours {
  day: number; // 0 = Monday, 6 = Sunday
  start: string; // "0900"
  end: string; // "2100"
  isOvernight: boolean;
}

// API Request/Response types
export interface ChatRequest {
  message: string;
  userId?: string;
  location?: UserLocation;
  selectedModel?: LLMModelKey;
  selectedEmbedding?: EmbeddingProvider;
  deepResearch?: boolean; // Enable deep research mode with enriched data and embeddings
}

export interface ChatResponse {
  message: string;
  userId: string;
  places?: Place[];
  intent?: ParsedIntent;
}

// Ranked place with similarity score
export interface RankedPlace extends Place {
  similarityScore: number;
}
