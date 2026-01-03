import { useState, useCallback } from "react";
import type { UserLocation } from "@yumly/shared";

interface UseLocationResult {
  location: UserLocation | null;
  error: string | null;
  loading: boolean;
  requestLocation: () => void;
}

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    setError(null);

    const handleSuccess = (position: GeolocationPosition) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: Date.now(),
      });
      setLoading(false);
    };

    const handleError = (err: GeolocationPositionError) => {
      let message = "Unable to get your location";
      switch (err.code) {
        case err.PERMISSION_DENIED:
          message =
            "Location permission denied. Please enable location access.";
          break;
        case err.POSITION_UNAVAILABLE:
          message = "Location information unavailable.";
          break;
        case err.TIMEOUT:
          message = "Location request timed out.";
          break;
      }
      setError(message);
      setLoading(false);
    };

    // First try with low accuracy (faster, works better on desktop)
    // Falls back to high accuracy if available
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      (err) => {
        // If low accuracy fails with timeout, try with high accuracy disabled
        if (err.code === err.TIMEOUT) {
          navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
            enableHighAccuracy: false,
            timeout: 30000,
            maximumAge: 600000, // 10 minutes
          });
        } else {
          handleError(err);
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 300000, // 5 minutes
      }
    );
  }, []);

  return { location, error, loading, requestLocation };
}
