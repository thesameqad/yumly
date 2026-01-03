import React from "react";
import ReactMarkdown from "react-markdown";
import type { ChatMessage as ChatMessageType, Place } from "@yumly/shared";

interface Props {
  message: ChatMessageType;
  places?: Place[];
}

export function ChatMessage({ message, places }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-yum-500 text-white rounded-br-md"
            : "bg-gray-100 text-gray-800 rounded-bl-md"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}

        {/* Place cards for assistant messages */}
        {!isUser && places && places.length > 0 && (
          <div className="mt-4 space-y-2">
            {places.slice(0, 3).map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PlaceCard({ place }: { place: Place }) {
  const distanceText = place.distance
    ? place.distance < 1000
      ? `${Math.round(place.distance)}m`
      : `${(place.distance / 1000).toFixed(1)}km`
    : null;

  return (
    <a
      href={place.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow border border-gray-200"
    >
      <div className="flex gap-3">
        {place.imageUrl && (
          <img
            src={place.imageUrl}
            alt={place.name}
            className="w-16 h-16 object-cover rounded-md flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate">{place.name}</h4>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {place.rating && (
              <span className="flex items-center">
                <span className="text-yellow-500 mr-1">★</span>
                {place.rating}
              </span>
            )}
            {place.priceLevel && <span>{place.priceLevel}</span>}
            {distanceText && <span>{distanceText}</span>}
          </div>
          <p className="text-xs text-gray-500 truncate mt-1">
            {place.categories.slice(0, 2).join(" • ")}
          </p>
        </div>
      </div>
    </a>
  );
}
