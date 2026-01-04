import React from "react";
import ReactMarkdown from "react-markdown";
import { Search } from "lucide-react";
import type { ChatMessage as ChatMessageType, Place } from "@yumly/shared";

interface Props {
  message: ChatMessageType;
  places?: Place[];
  onGetMoreDetails?: (place: Place) => void;
}

export function ChatMessage({ message, places, onGetMoreDetails }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-6`}>
      <div
        className={`max-w-[85%] rounded-2xl px-5 py-4 shadow-sm ${
          isUser
            ? "bg-gradient-to-br from-yum-500 to-yum-600 text-white rounded-br-none shadow-yum-100"
            : "bg-white text-gray-800 rounded-bl-none border border-gray-100"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>
        ) : (
          <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-yum-600 prose-strong:text-gray-900">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}

        {/* Place cards for assistant messages */}
        {!isUser && places && places.length > 0 && (
          <div className="mt-6 space-y-3">
            {places.slice(0, 3).map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                onGetMoreDetails={onGetMoreDetails}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface PlaceCardProps {
  place: Place;
  onGetMoreDetails?: (place: Place) => void;
}

function PlaceCard({ place, onGetMoreDetails }: PlaceCardProps) {
  const distanceMiles = place.distance ? place.distance / 1609.34 : null;
  const distanceText = distanceMiles
    ? distanceMiles < 0.1
      ? "nearby"
      : `${distanceMiles.toFixed(1)} mi`
    : null;

  const handleGetMoreDetails = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onGetMoreDetails) {
      onGetMoreDetails(place);
    }
  };

  return (
    <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 hover:border-yum-200 transition-colors">
      <a
        href={place.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block hover:bg-yum-50 transition-colors group"
      >
        <div className="flex gap-4">
          {place.imageUrl && (
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
              <img
                src={place.imageUrl}
                alt={place.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
          )}
          <div className="flex-1 min-w-0 py-0.5">
            <div className="flex justify-between items-start gap-2">
              <h4 className="font-bold text-gray-900 truncate group-hover:text-yum-700 transition-colors">
                {place.name}
              </h4>
              {place.rating && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="flex items-center text-xs font-bold bg-white px-1.5 py-0.5 rounded shadow-sm text-gray-700 border border-gray-100 whitespace-nowrap">
                    {place.rating}
                    <span className="text-yellow-400 ml-0.5">★</span>
                  </span>
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/a/ad/Yelp_Logo.svg"
                    alt="Yelp"
                    className="h-3 opacity-50"
                  />
                </div>
              )}
            </div>

            {place.address && (
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {place.address}, {place.city}
              </p>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
              {place.priceLevel && (
                <span className="font-medium text-gray-900">
                  {place.priceLevel}
                </span>
              )}
              {place.priceLevel && distanceText && (
                <span className="text-gray-300">•</span>
              )}
              {distanceText && <span>{distanceText}</span>}
            </div>

            <p className="text-xs text-gray-500 truncate mt-2 flex items-center gap-2">
              {place.categories.slice(0, 2).map((cat, i) => (
                <span
                  key={i}
                  className="bg-white px-2 py-0.5 rounded border border-gray-100"
                >
                  {cat}
                </span>
              ))}
            </p>
          </div>
        </div>
      </a>

      {/* Get More Details button */}
      {onGetMoreDetails && (
        <button
          onClick={handleGetMoreDetails}
          className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-yum-600 bg-yum-50 hover:bg-yum-100 rounded-lg transition-colors border border-yum-200"
        >
          <Search className="w-3 h-3" />
          Get More Details
        </button>
      )}
    </div>
  );
}
