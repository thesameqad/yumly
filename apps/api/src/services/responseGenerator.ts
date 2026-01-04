import { llmService } from "./llm.js";
import type { Place, RankedPlace, LLMModelKey, SortBy } from "@yumly/shared";
import type { PlaceEnrichment } from "./yelpAiChat.js";

const RESPONSE_SYSTEM_PROMPT = `You are Yumly, a friendly and knowledgeable dining recommendation assistant. You help users discover great places to eat and drink across the USA.

Your personality:
- Warm, enthusiastic, and genuinely helpful
- Knowledgeable about food, restaurants, and dining culture
- Concise but informative — respect the user's time
- Use casual, conversational language with occasional food-related enthusiasm

When presenting recommendations, you MUST structure your response like this:

1. **Opening Line**: Brief, relevant intro acknowledging what they're looking for

2. **Top Pick (1 place)**: Your #1 recommendation with:
   - Name, rating, price level
   - WHY it's great for their specific query
   - Distance/location context

3. **Quick Alternatives**: 2-3 other solid options in bullet format:
   - Each with name + one standout reason to visit

4. **Category Highlights** (when applicable, pick 1-2 that fit):
   - "📍 Closest to you: [name] — just [X] miles away"
   - "⭐ Highest rated: [name] — [X] stars from [N] reviews"
   - "🔥 Most popular: [name] — [N] reviews, a local favorite"
   - "💰 Budget-friendly: [name] — [price level]"

5. **Follow-up Question**: End with ONE helpful question like:
   - "Are you looking for dine-in or somewhere with outdoor seating?"
   - "Do you prefer somewhere walkable or is driving okay?"
   - "Want me to find places open late tonight?"
   - "Interested in places with happy hour deals?"
   - "Would you like me to narrow it down by price range?"

Format guidelines:
- Keep the main response 3-5 short paragraphs max
- Use the exact place names provided
- Convert distance to friendly format (e.g., "0.3 miles" → "just a 5-minute walk", "2.1 miles" → "about 5 min drive")
- NEVER include specific street addresses in your response — just use the city/neighborhood name
- NEVER make up information not in the data
- Use emoji sparingly for visual organization in category highlights`;

export class ResponseGenerator {
  async generateResponse(
    userQuery: string,
    places: RankedPlace[],
    modelKey: LLMModelKey = "GPT",
    context?: {
      chatHistory?: { role: "user" | "assistant"; content: string }[];
      dish?: string;
      cuisine?: string;
      sortBy?: SortBy;
    }
  ): Promise<string> {
    // Get top 5 for main recommendations
    const topPlaces = places.slice(0, 5);
    const placesContext = this.formatPlacesForLLM(topPlaces);

    // Calculate category highlights
    const highlights = this.calculateHighlights(places.slice(0, 10));

    const messages: {
      role: "user" | "assistant" | "system";
      content: string;
    }[] = [{ role: "system", content: RESPONSE_SYSTEM_PROMPT }];

    // Add chat history for context
    if (context?.chatHistory) {
      messages.push(...context.chatHistory.slice(-4)); // Last 4 messages
    }

    const sortContext = context?.sortBy
      ? `The user seems to prefer results sorted by: ${
          context.sortBy === "rating"
            ? "quality/ratings"
            : context.sortBy === "distance"
            ? "proximity"
            : context.sortBy === "review_count"
            ? "popularity"
            : "relevance"
        }`
      : "";

    const userPrompt = `User asked: "${userQuery}"

${context?.dish ? `They're specifically looking for: ${context.dish}` : ""}
${context?.cuisine ? `Cuisine preference: ${context.cuisine}` : ""}
${sortContext}

Here are the top matching places:
${placesContext}

Category highlights for your response:
${highlights}

Provide a helpful, personalized recommendation following the structured format. Make sure to include the category highlights and end with a follow-up question!`;

    messages.push({ role: "user", content: userPrompt });

    console.log("Generating response with messages:", messages, modelKey);

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
Keep responses brief and friendly.
Always end with a question to guide them toward making a food discovery!`,
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
Keep it short and helpful. End with a question offering alternatives.`,
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
   - Open now: ${place.isOpenNow ? "Yes" : "No/Unknown"}`;
      })
      .join("\n\n");
  }

  private calculateHighlights(places: RankedPlace[]): string {
    const highlights: string[] = [];

    // Find closest
    const withDistance = places.filter((p) => p.distance && p.distance > 0);
    if (withDistance.length > 0) {
      const closest = withDistance.reduce((a, b) =>
        (a.distance || Infinity) < (b.distance || Infinity) ? a : b
      );
      const miles = ((closest.distance || 0) / 1609.34).toFixed(1);
      highlights.push(`- Closest: "${closest.name}" at ${miles} miles`);
    }

    // Find highest rated
    const withRating = places.filter((p) => p.rating && p.rating > 0);
    if (withRating.length > 0) {
      const highestRated = withRating.reduce((a, b) =>
        (a.rating || 0) > (b.rating || 0) ? a : b
      );
      highlights.push(
        `- Highest rated: "${highestRated.name}" with ${highestRated.rating} stars`
      );
    }

    // Find most popular (most reviews)
    const withReviews = places.filter(
      (p) => p.reviewCount && p.reviewCount > 0
    );
    if (withReviews.length > 0) {
      const mostPopular = withReviews.reduce((a, b) =>
        (a.reviewCount || 0) > (b.reviewCount || 0) ? a : b
      );
      highlights.push(
        `- Most popular: "${mostPopular.name}" with ${mostPopular.reviewCount} reviews`
      );
    }

    // Find cheapest option
    const withPrice = places.filter((p) => p.priceLevel);
    if (withPrice.length > 0) {
      const cheapest = withPrice.reduce((a, b) =>
        (a.priceLevel || "$$$$").length < (b.priceLevel || "$$$$").length
          ? a
          : b
      );
      highlights.push(
        `- Budget-friendly: "${cheapest.name}" (${cheapest.priceLevel})`
      );
    }

    return highlights.length > 0
      ? highlights.join("\n")
      : "No category highlights available";
  }

  // Generate a detailed response for Deep Research mode
  async generateDeepResearchResponse(
    userQuery: string,
    places: RankedPlace[],
    enrichments: Map<string, PlaceEnrichment>,
    modelKey: LLMModelKey = "GPT",
    context?: {
      dish?: string;
      cuisine?: string;
      sortBy?: SortBy;
    }
  ): Promise<string> {
    const topPlaces = places.slice(0, 5);

    // Build detailed descriptions with enrichment data
    const placeDescriptions = topPlaces.map((place, i) => {
      const distanceMiles = place.distance
        ? (place.distance / 1609.34).toFixed(1)
        : null;
      const enrichment = enrichments.get(place.id);

      let desc = `${i + 1}. ${place.name}
   - Match Score: ${(place.similarityScore * 100).toFixed(
     0
   )}% (semantic match to your query)
   - Rating: ${place.rating || "N/A"} stars (${place.reviewCount || 0} reviews)
   - Price: ${place.priceLevel || "N/A"}
   - Distance: ${distanceMiles ? `${distanceMiles} miles` : "N/A"}
   - Categories: ${place.categories.join(", ")}
   - Address: ${place.address}, ${place.city}
   - Open now: ${place.isOpenNow ? "Yes" : "No/Unknown"}`;

      if (enrichment) {
        if (enrichment.specialties) {
          desc += `\n   - About: "${enrichment.specialties.substring(0, 300)}${
            enrichment.specialties.length > 300 ? "..." : ""
          }"`;
        }
        if (enrichment.reviewSnippet) {
          desc += `\n   - Customer review: "${enrichment.reviewSnippet.substring(
            0,
            150
          )}${enrichment.reviewSnippet.length > 150 ? "..." : ""}"`;
        }
        if (enrichment.vibes.length > 0) {
          desc += `\n   - Atmosphere: ${enrichment.vibes.join(", ")}`;
        }
        if (enrichment.amenities.length > 0) {
          desc += `\n   - Amenities: ${enrichment.amenities.join(", ")}`;
        }
      }

      return desc;
    });

    const systemPrompt = `You are Yumly, a friendly and knowledgeable dining assistant doing a deep dive into the options for your user.

You've done extra research on each place — looking at their story, what they're known for, customer experiences, and atmosphere. Now share what you found in a warm, conversational way.

Write your response like you're excitedly telling a friend about these places:

1. Start with a brief intro (1-2 sentences) — mention you dug deeper to find the best match

2. **Your Top Pick**: Lead with your #1 recommendation
   - Why it's perfect for what they're looking for
   - Share the interesting details you found (their specialties, vibe, what customers love)
   - Include a customer quote if available

3. **Other Great Options**: For 2-3 alternatives, briefly explain:
   - What makes each one unique
   - Who might prefer this option instead

4. **Quick Tips**: End with 2-3 casual observations like "If you're in the mood for X, definitely check out Y"

Keep your tone warm and enthusiastic — like you genuinely want to help them find the perfect spot!
Don't use headers like "Analysis Summary" or "Follow-up".
Don't include comparison tables.
Don't ask if they want more details (there's a button for that).
Never include specific street addresses — just use city/neighborhood names.`;

    const userPrompt = `User query: "${userQuery}"
${context?.dish ? `Looking for: ${context.dish}` : ""}
${context?.cuisine ? `Cuisine: ${context.cuisine}` : ""}

Here's what I found with Deep Research (ranked by how well they match the query):

${placeDescriptions.join("\n\n")}

Share these findings in a friendly, helpful way!`;

    const messages: {
      role: "user" | "assistant" | "system";
      content: string;
    }[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    console.log("Generating Deep Research response...");

    return llmService.chat(messages, modelKey, { temperature: 0.7 });
  }
}

export const responseGenerator = new ResponseGenerator();
