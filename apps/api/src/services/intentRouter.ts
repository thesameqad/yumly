import { llmService } from "./llm.js";
import type { ParsedIntent, LLMModelKey } from "@yumly/shared";

const INTENT_SYSTEM_PROMPT = `You are an intent classification system for a dining recommendation chatbot called Yumly.

Your job is to analyze user messages and extract:
1. The intent (what the user wants to do)
2. Relevant entities (cuisine, place type, dish, location, filters)

Available intents:
- search_places: User wants to find restaurants/cafes/bars (e.g., "pizza places in Frisco", "best Italian restaurants in Austin")
- get_recommendations: User wants personalized suggestions (e.g., "where should I eat?", "recommend a good brunch spot")
- filter_results: User wants to narrow down options (e.g., "only show places open now", "under $20")
- get_details: User asks about a specific place (e.g., "tell me more about X", "what are the hours?")
- general_chat: General conversation not about finding places (e.g., "hello", "thanks", "what can you do?")

Extract these entities when present:
- cuisine: The type of food (italian, mexican, japanese, pizza, sushi, etc.)
- placeType: restaurant, cafe, bar, or any
- dish: Specific dish mentioned (tiramisu, burger, ramen, etc.)
- location: City, neighborhood, or area mentioned (e.g., "Frisco", "downtown Austin", "Times Square NYC")
- needsUserLocation: Set to true ONLY if query implies "near me", "nearby", "around here", "close by" WITHOUT specifying a location
- filters: openNow, priceLevel (1-4), rating (minimum), distance (meters)

Examples:
- "Best pizza in Frisco" → location: "Frisco, TX", needsUserLocation: false
- "Pizza places near me" → location: null, needsUserLocation: true
- "I want tacos" → location: null, needsUserLocation: true (implied nearby)
- "Restaurants in downtown Seattle" → location: "downtown Seattle, WA", needsUserLocation: false

Respond with valid JSON only:
{
  "intent": "search_places|get_recommendations|filter_results|get_details|general_chat",
  "entities": {
    "cuisine": "string or null",
    "placeType": "restaurant|cafe|bar|any",
    "dish": "string or null",
    "location": "string or null (city/area extracted from query)",
    "needsUserLocation": "boolean (true if 'near me' or implied nearby without location)",
    "query": "the original search query for embedding matching",
    "filters": {
      "openNow": "boolean or null",
      "priceLevel": "[1,2,3,4] or null",
      "rating": "number or null",
      "distance": "number in meters or null"
    }
  },
  "confidence": 0.0-1.0
}`;

export class IntentRouter {
  async parseIntent(
    userMessage: string,
    modelKey: LLMModelKey = "GPT"
  ): Promise<ParsedIntent> {
    try {
      const response = await llmService.chat(
        [
          { role: "system", content: INTENT_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        modelKey,
        { temperature: 0.1, json: true }
      );

      const parsed = JSON.parse(response);

      return {
        intent: parsed.intent || "general_chat",
        entities: {
          cuisine: parsed.entities?.cuisine || undefined,
          placeType: parsed.entities?.placeType || "any",
          dish: parsed.entities?.dish || undefined,
          query: parsed.entities?.query || userMessage,
          location: parsed.entities?.location || undefined,
          needsUserLocation: parsed.entities?.needsUserLocation ?? true,
          filters: parsed.entities?.filters || undefined,
        },
        confidence: parsed.confidence || 0.5,
      };
    } catch (error) {
      console.error("Intent parsing error:", error);
      // Fallback to search if parsing fails
      return {
        intent: "search_places",
        entities: {
          query: userMessage,
          placeType: "any",
          needsUserLocation: true,
        },
        confidence: 0.3,
      };
    }
  }

  isSearchIntent(intent: ParsedIntent): boolean {
    return ["search_places", "get_recommendations"].includes(intent.intent);
  }

  needsLocation(intent: ParsedIntent): boolean {
    // Only needs user location if it's a search AND no location was specified in query
    if (!this.isSearchIntent(intent)) return false;
    return (
      intent.entities.needsUserLocation === true && !intent.entities.location
    );
  }
}

export const intentRouter = new IntentRouter();
