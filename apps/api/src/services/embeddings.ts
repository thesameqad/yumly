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

  // Create a rich text description of a place for embedding
  private createPlaceDescription(place: Place): string {
    const parts = [
      place.name,
      place.categories.join(", "),
      place.rating ? `${place.rating} stars` : "",
      place.priceLevel ? `Price: ${place.priceLevel}` : "",
      place.reviewCount ? `${place.reviewCount} reviews` : "",
    ].filter(Boolean);

    return parts.join(". ");
  }
}

export const embeddingsService = new EmbeddingsService();
