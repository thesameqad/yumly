import { llmService } from "./llm.js";
import type { Place, RankedPlace, LLMModelKey } from "@yumly/shared";

const RESPONSE_SYSTEM_PROMPT = `You are Yumly, a friendly and knowledgeable dining recommendation assistant. You help users discover great places to eat and drink.

Your personality:
- Warm, enthusiastic, and helpful
- Knowledgeable about food and dining
- Give concise but informative responses
- Use casual, conversational language

When presenting recommendations:
- Start with your top pick and explain WHY it's great for their query
- Mention 2-3 alternatives briefly
- Include helpful details: distance, rating, price range, what it's known for
- Be specific about dishes or specialties when relevant

Format guidelines:
- Keep responses concise (2-4 short paragraphs max)
- Use the place names exactly as provided
- Mention distance in a friendly way ("just 3 min away", "a short walk")
- Don't make up information not provided in the data`;

export class ResponseGenerator {
  async generateResponse(
    userQuery: string,
    places: RankedPlace[],
    modelKey: LLMModelKey = "GPT",
    context?: {
      chatHistory?: { role: "user" | "assistant"; content: string }[];
      dish?: string;
      cuisine?: string;
    }
  ): Promise<string> {
    const placesContext = this.formatPlacesForLLM(places.slice(0, 5));

    const messages: {
      role: "user" | "assistant" | "system";
      content: string;
    }[] = [{ role: "system", content: RESPONSE_SYSTEM_PROMPT }];

    // Add chat history for context
    if (context?.chatHistory) {
      messages.push(...context.chatHistory.slice(-4)); // Last 4 messages
    }

    const userPrompt = `User asked: "${userQuery}"

${context?.dish ? `They're looking for: ${context.dish}` : ""}
${context?.cuisine ? `Cuisine preference: ${context.cuisine}` : ""}

Here are the top matching places:
${placesContext}

Provide a helpful, personalized recommendation based on their query.`;

    messages.push({ role: "user", content: userPrompt });

    return llmService.chat(messages, modelKey, { temperature: 0.7 });
  }

  async generateGeneralResponse(
    userQuery: string,
    modelKey: LLMModelKey = "GPT",
    chatHistory?: { role: "user" | "assistant"; content: string }[]
  ): Promise<string> {
    const messages: {
      role: "user" | "assistant" | "system";
      content: string;
    }[] = [
      {
        role: "system",
        content: `You are Yumly, a friendly dining recommendation assistant. 
You help users find great places to eat and drink anywhere in the USA.
If users haven't asked about a specific place yet, encourage them to ask! 
You can help with restaurants, cafes, bars, and any type of cuisine.
Keep responses brief and friendly.`,
      },
    ];

    if (chatHistory) {
      messages.push(...chatHistory.slice(-4));
    }

    messages.push({ role: "user", content: userQuery });

    return llmService.chat(messages, modelKey, { temperature: 0.8 });
  }

  async generateNoResultsResponse(
    userQuery: string,
    modelKey: LLMModelKey = "GPT"
  ): Promise<string> {
    const messages: {
      role: "user" | "assistant" | "system";
      content: string;
    }[] = [
      {
        role: "system",
        content: `You are Yumly, a friendly dining assistant. The user searched for something but no results were found. 
Apologize briefly and suggest they try:
- A broader search term
- A different cuisine type
- Increasing the search radius
Keep it short and helpful.`,
      },
      {
        role: "user",
        content: `I searched for: "${userQuery}" but nothing was found.`,
      },
    ];

    return llmService.chat(messages, modelKey, { temperature: 0.7 });
  }

  private formatPlacesForLLM(places: RankedPlace[]): string {
    return places
      .map((place, i) => {
        const distanceMiles = place.distance
          ? (place.distance / 1609.34).toFixed(1)
          : null;
        const distance = distanceMiles
          ? `${distanceMiles} miles away`
          : "distance unknown";

        return `${i + 1}. ${place.name}
   - Categories: ${place.categories.join(", ")}
   - Rating: ${place.rating || "N/A"} stars (${place.reviewCount || 0} reviews)
   - Price: ${place.priceLevel || "N/A"}
   - Distance: ${distance}
   - Address: ${place.address}, ${place.city}
   - Open now: ${place.isOpenNow ? "Yes" : "No/Unknown"}
   - Match score: ${(place.similarityScore * 100).toFixed(0)}%`;
      })
      .join("\n\n");
  }
}

export const responseGenerator = new ResponseGenerator();
