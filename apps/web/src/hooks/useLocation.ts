import { useState, useCallback, useEffect, useRef } from "react";
import type { UserLocation } from "@yumly/shared";

interface UseLocationResult {
  location: UserLocation | null;
  cityName: string | null;
  error: string | null;
  loading: boolean;
  ready: boolean;
  requestLocation: () => void;
}

// Reverse geocode to get city name from coordinates
async function getCityName(lat: number, lng: number): Promise<string | null> {
  try {
    console.log("Fetching city name for:", lat, lng);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`,
      {
        headers: {
          "User-Agent": "Yumly/1.0 (https://yumly.ai)",
        },
      }
    );
    if (!response.ok) return null;
    const data = await response.json();
    const city =
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.county ||
      data.address?.state;
    return city || null;
  } catch {
    return null;
  }
}

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [cityName, setCityName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const autoFetchAttempted = useRef(false);
  const fetchingRef = useRef(false);

  const fetchCityName = useCallback(async (lat: number, lng: number) => {
    const city = await getCityName(lat, lng);
    if (city) {
      setCityName(city);
    }
  }, []);

  const requestLocation = useCallback(() => {
    console.log("Requesting user location...", fetchingRef.current);
    // Prevent duplicate requests
    if (fetchingRef.current) return;

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setReady(true);
      return;
    }

    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    const onSuccess = (position: GeolocationPosition) => {
      console.log("Location obtained:", position);
      const newLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: Date.now(),
      };
      setLocation(newLocation);
      setLoading(false);
      setReady(true);
      fetchingRef.current = false;

      // Fetch city name in background (don't await)
      fetchCityName(newLocation.latitude, newLocation.longitude);
    };

    const onError = (err: GeolocationPositionError) => {
      console.log("Location error:", err);
      let message = "Unable to get your location";
      switch (err.code) {
        case err.PERMISSION_DENIED:
          message = "Location permission denied";
          break;
        case err.POSITION_UNAVAILABLE:
          message = "Location unavailable";
          break;
        case err.TIMEOUT:
          message = "Location request timed out";
          break;
      }
      setError(message);
      setLoading(false);
      setReady(true);
      fetchingRef.current = false;
    };

    // Use simple request with reasonable timeout
    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 300000,
    });
  }, [fetchCityName]);

  // Auto-fetch location on mount if permission is already granted
  useEffect(() => {
    if (autoFetchAttempted.current) return;
    autoFetchAttempted.current = true;

    // If geolocation not supported, mark ready immediately
    if (!navigator.geolocation) {
      setReady(true);
      return;
    }

    // Check if permissions API is available
    if (!navigator.permissions) {
      // Can't check permission, just mark as ready and let user click button
      setReady(true);
      return;
    }

    navigator.permissions
      .query({ name: "geolocation" })
      .then((permissionStatus) => {
        if (permissionStatus.state === "granted") {
          requestLocation();
        } else {
          setReady(true);
        }
      })
      .catch(() => {
        setReady(true);
      });
  }, [requestLocation]);

  return { location, cityName, error, loading, ready, requestLocation };
}
