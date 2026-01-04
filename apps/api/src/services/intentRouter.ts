import { llmService } from "./llm.js";
import type {
  ParsedIntent,
  LLMModelKey,
  SortBy,
  PlaceAttributes,
} from "@yumly/shared";

const INTENT_SYSTEM_PROMPT = `You are an intent classification system for a dining recommendation chatbot called Yumly.

Your job is to analyze user messages and extract:
1. The intent (what the user wants to do)
2. Relevant entities (cuisine, place type, dish, location, filters, sorting)

Available intents:
- search_places: User wants to find restaurants/cafes/bars (e.g., "pizza places in Frisco", "best Italian restaurants in Austin")
- get_recommendations: User wants personalized suggestions (e.g., "where should I eat?", "recommend a good brunch spot")
- filter_results: User wants to narrow down options (e.g., "only show places open now", "under $20")
- place_details: User asks about a SPECIFIC place by name (e.g., "tell me more about Pizza Twist", "what's the vibe at Starbucks on Legacy?", "details for Chipotle")
- general_chat: General conversation not about finding places (e.g., "hello", "thanks", "what can you do?")

IMPORTANT: Use "place_details" ONLY when the user mentions a SPECIFIC restaurant/place name. Examples:
- "tell me more about Pizza Twist" → place_details, placeName: "Pizza Twist"
- "what are the hours for Starbucks?" → place_details, placeName: "Starbucks"
- "is Chipotle good for lunch?" → place_details, placeName: "Chipotle"
- "details about the coffee shop" → NOT place_details (no specific name)
- "tell me about pizza places" → search_places (asking about category, not specific place)

Extract these entities when present:
- cuisine: The type of food (italian, mexican, japanese, pizza, sushi, etc.)
- placeType: restaurant, cafe, bar, or any
- dish: Specific dish mentioned (tiramisu, burger, ramen, etc.)
- location: City, neighborhood, or area mentioned (e.g., "Frisco", "downtown Austin", "Times Square NYC")
- placeName: The specific restaurant/business name when asking for details
- needsUserLocation: Set to true ONLY if query implies "near me", "nearby", "around here", "close by" WITHOUT specifying a location
- filters: openNow, priceLevel (1-4), rating (minimum), distance (meters)
- attributes: Special requirements (wheelchairAccessible, genderNeutralRestrooms, openToAll, dogsAllowed)
- sortBy: How to sort results based on user's phrasing:
  * "best_match" (default): general queries like "pizza places"
  * "rating": queries emphasizing quality like "best", "top rated", "highest rated", "good"
  * "distance": queries about proximity like "closest", "nearest", "walking distance"
  * "review_count": queries about popularity like "popular", "most reviewed", "famous"

Examples:
- "Best pizza in Frisco" → intent: search_places, sortBy: "rating", location: "Frisco, TX"
- "Closest coffee shop" → intent: search_places, sortBy: "distance", needsUserLocation: true
- "Tell me about Pizza Twist" → intent: place_details, placeName: "Pizza Twist"
- "What's Starbucks on Main Street like?" → intent: place_details, placeName: "Starbucks", location: "Main Street"
- "Popular burger places" → intent: search_places, sortBy: "review_count"

Respond with valid JSON only:
{
  "intent": "search_places|get_recommendations|filter_results|place_details|general_chat",
  "entities": {
    "cuisine": "string or null",
    "placeType": "restaurant|cafe|bar|any",
    "dish": "string or null",
    "location": "string or null (city/area extracted from query)",
    "placeName": "string or null (specific business name for place_details intent)",
    "needsUserLocation": "boolean (true if 'near me' or implied nearby without location)",
    "query": "the original search query",
    "sortBy": "best_match|rating|distance|review_count",
    "filters": {
      "openNow": "boolean or null",
      "priceLevel": "[1,2,3,4] or null (1=cheap, 4=expensive)",
      "rating": "number or null (minimum rating)",
      "distance": "number in meters or null"
    },
    "attributes": {
      "wheelchairAccessible": "boolean or null",
      "genderNeutralRestrooms": "boolean or null",
      "openToAll": "boolean or null",
      "dogsAllowed": "boolean or null"
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
      console.log("Calling Intent Router with message:", userMessage);
      const response = await llmService.chat(
        [
          { role: "system", content: INTENT_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        modelKey,
        { temperature: 0.1, json: true }
      );

      const parsed = JSON.parse(response);

      console.log("Parsed intent:", parsed);

      // Parse attributes if present
      const attributes: PlaceAttributes | undefined = parsed.entities
        ?.attributes
        ? {
            wheelchairAccessible:
              parsed.entities.attributes.wheelchairAccessible || undefined,
            genderNeutralRestrooms:
              parsed.entities.attributes.genderNeutralRestrooms || undefined,
            openToAll: parsed.entities.attributes.openToAll || undefined,
            dogsAllowed: parsed.entities.attributes.dogsAllowed || undefined,
          }
        : undefined;

      // Only include attributes if at least one is set
      const hasAttributes =
        attributes && Object.values(attributes).some((v) => v !== undefined);

      return {
        intent: parsed.intent || "general_chat",
        entities: {
          cuisine: parsed.entities?.cuisine || undefined,
          placeType: parsed.entities?.placeType || "any",
          dish: parsed.entities?.dish || undefined,
          query: parsed.entities?.query || userMessage,
          location: parsed.entities?.location || undefined,
          placeName: parsed.entities?.placeName || undefined,
          needsUserLocation: parsed.entities?.needsUserLocation ?? true,
          filters: parsed.entities?.filters || undefined,
          attributes: hasAttributes ? attributes : undefined,
          sortBy: (parsed.entities?.sortBy as SortBy) || "best_match",
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
          sortBy: "best_match",
        },
        confidence: 0.3,
      };
    }
  }

  isSearchIntent(intent: ParsedIntent): boolean {
    return ["search_places", "get_recommendations"].includes(intent.intent);
  }

  isPlaceDetailsIntent(intent: ParsedIntent): boolean {
    return intent.intent === "place_details" && !!intent.entities.placeName;
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
