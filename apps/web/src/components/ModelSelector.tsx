import React from "react";
import {
  LLM_MODELS,
  EMBEDDING_PROVIDERS,
  type LLMModelKey,
  type EmbeddingProvider,
} from "@yumly/shared";

interface Props {
  selectedModel: LLMModelKey;
  selectedEmbedding: EmbeddingProvider;
  onModelChange: (model: LLMModelKey) => void;
  onEmbeddingChange: (embedding: EmbeddingProvider) => void;
}

const MODEL_LABELS: Record<LLMModelKey, string> = {
  GPT: "GPT-4o Mini",
  CLAUDE: "Claude 3.5 Sonnet",
  GEMINI: "Gemini 2.0 Flash",
  GROK: "Grok",
  MISTRAL: "Mistral Small",
  LLAMA: "Llama 3.1 70B",
  DEEPSEEK: "DeepSeek Chat",
  QWEN: "Qwen 2.5 72B",
};

const EMBEDDING_LABELS: Record<EmbeddingProvider, string> = {
  openai: "OpenAI",
  voyage: "Voyage AI",
  jina: "Jina AI",
  cohere: "Cohere",
};

export function ModelSelector({
  selectedModel,
  selectedEmbedding,
  onModelChange,
  onEmbeddingChange,
}: Props) {
  return (
    <div className="flex flex-wrap gap-4 text-sm">
      <div className="flex items-center gap-2">
        <label className="text-gray-500 font-medium text-xs uppercase tracking-wider">
          Model
        </label>
        <select
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value as LLMModelKey)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-yum-500 focus:border-transparent shadow-sm hover:border-gray-300 transition-colors cursor-pointer"
        >
          {Object.keys(LLM_MODELS).map((key) => (
            <option key={key} value={key}>
              {MODEL_LABELS[key as LLMModelKey]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-gray-500 font-medium text-xs uppercase tracking-wider">
          Ranking
        </label>
        <select
          value={selectedEmbedding}
          onChange={(e) =>
            onEmbeddingChange(e.target.value as EmbeddingProvider)
          }
          className="border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-yum-500 focus:border-transparent shadow-sm hover:border-gray-300 transition-colors cursor-pointer"
        >
          {Object.values(EMBEDDING_PROVIDERS).map((provider) => (
            <option key={provider} value={provider}>
              {EMBEDDING_LABELS[provider]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
