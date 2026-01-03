import React from "react";
import type { UserLocation } from "@yumly/shared";

interface Props {
  location: UserLocation | null;
  loading: boolean;
  error: string | null;
  onRequestLocation: () => void;
}

export function LocationButton({
  location,
  loading,
  error,
  onRequestLocation,
}: Props) {
  const hasLocation = !!location;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onRequestLocation}
        disabled={loading}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          hasLocation
            ? "bg-green-100 text-green-700 hover:bg-green-200"
            : error
            ? "bg-red-100 text-red-700 hover:bg-red-200"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
        title={
          hasLocation
            ? `Location set (${location.latitude.toFixed(
                4
              )}, ${location.longitude.toFixed(4)})`
            : error || "Click to share your location"
        }
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path
              fillRule="evenodd"
              d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
              clipRule="evenodd"
            />
          </svg>
        )}
        <span>{hasLocation ? "Location set" : "Set location"}</span>
      </button>

      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
