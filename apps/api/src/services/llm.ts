import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { LLM_MODELS, type LLMModelKey } from "@yumly/shared";

export class LLMService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        "HTTP-Referer": "https://yumly.ai",
        "X-Title": "Yumly - Dining Recommendations",
      },
    });
  }

  async chat(
    messages: ChatCompletionMessageParam[],
    modelKey: LLMModelKey = "GPT",
    options: {
      temperature?: number;
      maxTokens?: number;
      json?: boolean;
    } = {}
  ): Promise<string> {
    const modelId = LLM_MODELS[modelKey];

    const response = await this.client.chat.completions.create({
      model: modelId,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
      response_format: options.json ? { type: "json_object" } : undefined,
    });

    return response.choices[0]?.message?.content || "";
  }

  async chatStream(
    messages: ChatCompletionMessageParam[],
    modelKey: LLMModelKey = "GPT",
    onChunk: (chunk: string) => void,
    options: {
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<string> {
    const modelId = LLM_MODELS[modelKey];

    const stream = await this.client.chat.completions.create({
      model: modelId,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
      stream: true,
    });

    let fullResponse = "";

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullResponse += content;
        onChunk(content);
      }
    }

    return fullResponse;
  }
}

export const llmService = new LLMService();
