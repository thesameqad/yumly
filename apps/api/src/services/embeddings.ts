import OpenAI from "openai";
import type { Place, RankedPlace, EmbeddingProvider } from "@yumly/shared";

// Embedding models available via OpenRouter
// See: https://openrouter.ai/models?modality=embedding
const EMBEDDING_MODELS: Record<EmbeddingProvider, string> = {
  openai: "openai/text-embedding-3-small",
  voyage: "voyage/voyage-3-lite",
  jina: "jina/jina-embeddings-v3",
  cohere: "cohere/embed-english-v3.0",
};

export class EmbeddingsService {
  private client: OpenAI;

  constructor() {
    // Use OpenRouter for all embedding providers
    this.client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        "HTTP-Referer": "https://yumly.ai",
        "X-Title": "Yumly - Dining Recommendations",
      },
    });
  }

  async getEmbedding(
    text: string,
    provider: EmbeddingProvider = "openai"
  ): Promise<number[]> {
    const model = EMBEDDING_MODELS[provider];
    const response = await this.client.embeddings.create({
      model,
      input: text,
    });
    return response.data[0].embedding;
  }

  async getEmbeddings(
    texts: string[],
    provider: EmbeddingProvider = "openai"
  ): Promise<number[][]> {
    const model = EMBEDDING_MODELS[provider];
    const response = await this.client.embeddings.create({
      model,
      input: texts,
    });
    return response.data.map((d) => d.embedding);
  }

  // Cosine similarity between two vectors
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error("Vectors must have same length");
    }

    let dot = 0;
    let magA = 0;
    let magB = 0;

    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }

    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }

  // Rank places by semantic similarity to query
  async rankPlaces(
    query: string,
    places: Place[],
    provider: EmbeddingProvider = "openai"
  ): Promise<RankedPlace[]> {
    if (places.length === 0) return [];

    // TODO: Enable when we have better data (reviews, descriptions)
    // For now, skip embedding ranking and just return with default score
    if (false) {
      // Create rich descriptions for each place
      const placeDescriptions = places.map((place) =>
        this.createPlaceDescription(place)
      );

      // Get all embeddings
      const [queryEmbedding, placeEmbeddings] = await Promise.all([
        this.getEmbedding(query, provider),
        this.getEmbeddings(placeDescriptions, provider),
      ]);

      // Calculate similarities and rank
      const rankedPlaces: RankedPlace[] = places.map((place, i) => ({
        ...place,
        similarityScore: this.cosineSimilarity(
          queryEmbedding,
          placeEmbeddings[i]
        ),
      }));

      // Sort by similarity (highest first)
      rankedPlaces.sort((a, b) => b.similarityScore - a.similarityScore);

      return rankedPlaces;
    }

    // Return places with default similarity score (preserve Yelp's ordering)
    return places.map((place) => ({
      ...place,
      similarityScore: 1.0,
    }));
  }

  // Rank places using pre-built enriched text descriptions (for Deep Research mode)
  async rankPlacesWithTexts(
    query: string,
    places: Place[],
    placeTexts: string[],
    provider: EmbeddingProvider = "openai"
  ): Promise<RankedPlace[]> {
    if (places.length === 0) return [];
    if (places.length !== placeTexts.length) {
      throw new Error("Places and texts arrays must have same length");
    }

    console.log("Deep Research: Computing embeddings for ranking...");

    // Get all embeddings
    const [queryEmbedding, placeEmbeddings] = await Promise.all([
      this.getEmbedding(query, provider),
      this.getEmbeddings(placeTexts, provider),
    ]);

    // Calculate similarities and rank
    const rankedPlaces: RankedPlace[] = places.map((place, i) => ({
      ...place,
      similarityScore: this.cosineSimilarity(
        queryEmbedding,
        placeEmbeddings[i]
      ),
    }));

    // Sort by similarity (highest first)
    rankedPlaces.sort((a, b) => b.similarityScore - a.similarityScore);

    console.log(
      "Deep Research ranking results:",
      rankedPlaces.map(
        (p) => `${p.name}: ${(p.similarityScore * 100).toFixed(1)}%`
      )
    );

    return rankedPlaces;
  }

  // Create a rich text description of a place for embedding
  // Note: Reviews require paid Yelp plan, so we use categories and name
  private createPlaceDescription(place: Place): string {
    const parts = [
      place.name,
      // Categories are key for matching food types
      `Categories: ${place.categories.join(", ")}`,
      place.rating ? `Rating: ${place.rating} stars` : "",
      place.priceLevel ? `Price: ${place.priceLevel}` : "",
      place.reviewCount ? `${place.reviewCount} reviews` : "",
      place.isOpenNow !== undefined
        ? place.isOpenNow
          ? "Currently open"
          : "Currently closed"
        : "",
      place.city,
    ].filter(Boolean);

    return parts.join(". ");
  }
}

export const embeddingsService = new EmbeddingsService();
