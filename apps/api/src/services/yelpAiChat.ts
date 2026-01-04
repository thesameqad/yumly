import type { Place } from "@yumly/shared";

interface YelpAiChatResponse {
  chat_id: string;
  response: {
    text: string;
    tags: Array<{
      tag_type: string;
      start: number;
      end: number;
      meta?: { business_id: string };
    }>;
  };
  types: string[];
  entities: Array<{
    businesses: YelpAiChatBusiness[];
  }>;
}

interface YelpAiChatBusiness {
  id: string;
  alias: string;
  name: string;
  url: string;
  location: {
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip_code?: string;
    formatted_address: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  review_count: number;
  price?: string;
  rating: number;
  categories: Array<{ alias: string; title: string }>;
  phone: string;
  attributes: {
    AboutThisBizSpecialties?: string;
    AboutThisBizHistory?: string;
    AboutThisBizBio?: string;
    GoodForWorking?: boolean;
    GoodForKids?: boolean;
    GenderNeutralRestrooms?: boolean;
    WiFi?: string;
    BikeParking?: boolean;
    RestaurantsDelivery?: boolean;
    RestaurantsTakeOut?: boolean;
    Caters?: boolean;
    DogsAllowed?: boolean;
    WheelchairAccessible?: boolean;
    NoiseLevel?: string;
    MenuUrl?: string;
    BusinessDisplayUrl?: string;
  };
  contextual_info?: {
    review_snippet?: string;
    summary?: string;
    photos?: Array<{ original_url: string }>;
  };
}

export interface PlaceEnrichment {
  description: string;
  specialties?: string;
  reviewSnippet?: string;
  amenities: string[];
  vibes: string[];
  photos: string[];
  menuUrl?: string;
  websiteUrl?: string;
}

export class YelpAiChatService {
  private apiKey: string;
  private baseUrl = "https://api.yelp.com";
  private aiChatEndpoint = "/ai/chat/v2";

  constructor() {
    this.apiKey = process.env.YELP_API_KEY || "";
  }

  /**
   * Get rich description and attributes for a single place using Yelp AI Chat
   * Used for "tell me more about X" queries
   */
  async getPlaceDetails(
    placeName: string,
    address?: string,
    city?: string
  ): Promise<PlaceEnrichment | null> {
    try {
      let query = `Give details for ${placeName}`;
      if (address) {
        query += ` at ${address}`;
      }
      if (city) {
        query += `, ${city}`;
      }

      console.log("Yelp AI Chat query:", query);

      const response = await fetch(`${this.baseUrl}${this.aiChatEndpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        console.error(`Yelp AI Chat error: ${response.status}`);
        return null;
      }

      const data: YelpAiChatResponse = await response.json();

      // Extract the description from response text and business data
      const business = data.entities?.[0]?.businesses?.[0];

      return this.extractEnrichment(data.response.text, business);
    } catch (error) {
      console.error("Error getting place details:", error);
      return null;
    }
  }

  /**
   * Enrich multiple places for deep research mode
   */
  async enrichPlaces(
    places: Place[],
    limit: number = 5
  ): Promise<Map<string, PlaceEnrichment>> {
    const enrichments = new Map<string, PlaceEnrichment>();

    // Only enrich top N places to save API calls
    const placesToEnrich = places.slice(0, limit);

    console.log(
      `Deep Research: Enriching ${placesToEnrich.length} places with Yelp AI Chat...`
    );

    // Process sequentially with small delays to avoid rate limiting
    for (let i = 0; i < placesToEnrich.length; i++) {
      const place = placesToEnrich[i];

      // Small delay between requests
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      const enrichment = await this.getPlaceDetails(
        place.name,
        place.address,
        place.city
      );

      if (enrichment) {
        enrichments.set(place.id, enrichment);
        console.log(`  ✓ Enriched: ${place.name}`);
      } else {
        console.log(`  ✗ Failed to enrich: ${place.name}`);
      }
    }

    return enrichments;
  }

  private extractEnrichment(
    responseText: string,
    business?: YelpAiChatBusiness
  ): PlaceEnrichment {
    const attrs = business?.attributes || {};
    const contextual = business?.contextual_info || {};

    const amenities: string[] = [];
    const vibes: string[] = [];

    // Extract amenities
    if (attrs.WiFi === "free") amenities.push("Free WiFi");
    if (attrs.WiFi === "paid") amenities.push("Paid WiFi");
    if (attrs.RestaurantsDelivery) amenities.push("Delivery available");
    if (attrs.RestaurantsTakeOut) amenities.push("Takeout available");
    if (attrs.Caters) amenities.push("Catering available");
    if (attrs.BikeParking) amenities.push("Bike parking");
    if (attrs.WheelchairAccessible) amenities.push("Wheelchair accessible");
    if (attrs.GenderNeutralRestrooms)
      amenities.push("Gender neutral restrooms");
    if (attrs.DogsAllowed) amenities.push("Dog friendly");

    // Extract vibes
    if (attrs.GoodForWorking) vibes.push("Good for working");
    if (attrs.GoodForKids) vibes.push("Good for kids");
    if (attrs.NoiseLevel === "quiet") vibes.push("Quiet atmosphere");
    if (attrs.NoiseLevel === "average") vibes.push("Moderate noise level");
    if (attrs.NoiseLevel === "loud") vibes.push("Lively atmosphere");

    // Extract photos
    const photos = contextual.photos?.map((p) => p.original_url) || [];

    // Clean up review snippet
    const reviewSnippet = contextual.review_snippet
      ?.replace(/\[\[HIGHLIGHT\]\]/g, "")
      .replace(/\[\[ENDHIGHLIGHT\]\]/g, "");

    return {
      description: responseText,
      specialties: attrs.AboutThisBizSpecialties || undefined,
      reviewSnippet,
      amenities,
      vibes,
      photos,
      menuUrl: attrs.MenuUrl,
      websiteUrl: attrs.BusinessDisplayUrl,
    };
  }

  /**
   * Build a rich text description for semantic embeddings
   */
  buildEmbeddingText(place: Place, enrichment: PlaceEnrichment): string {
    const parts: string[] = [];

    // Basic info
    parts.push(place.name);
    parts.push(place.categories.join(", "));

    // Specialties (most valuable for semantic search!)
    if (enrichment.specialties) {
      parts.push(enrichment.specialties);
    }

    // Review snippet
    if (enrichment.reviewSnippet) {
      parts.push(enrichment.reviewSnippet);
    }

    // Vibes
    if (enrichment.vibes.length > 0) {
      parts.push(enrichment.vibes.join(", "));
    }

    // Amenities
    if (enrichment.amenities.length > 0) {
      parts.push(enrichment.amenities.join(", "));
    }

    // Rating context
    if (place.rating) {
      if (place.rating >= 4.5) parts.push("excellent highly-rated top-rated");
      else if (place.rating >= 4.0) parts.push("well-reviewed popular good");
      else if (place.rating >= 3.5) parts.push("decent average");
    }

    // Price context
    if (place.priceLevel) {
      const priceTerms: Record<string, string> = {
        $: "budget-friendly affordable cheap inexpensive",
        $$: "moderate mid-range reasonable",
        $$$: "upscale pricey fancy",
        $$$$: "fine-dining expensive luxury premium",
      };
      if (priceTerms[place.priceLevel]) {
        parts.push(priceTerms[place.priceLevel]);
      }
    }

    return parts.join(". ");
  }
}

export const yelpAiChatService = new YelpAiChatService();
