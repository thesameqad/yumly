import type {
  Place,
  PlaceFilters,
  PlaceAttributes,
  UserLocation,
  DayHours,
  SortBy,
} from "@yumly/shared";

interface YelpBusiness {
  id: string;
  name: string;
  categories: { alias: string; title: string }[];
  rating?: number;
  review_count?: number;
  price?: string;
  location: {
    address1: string;
    city: string;
    state: string;
    zip_code: string;
  };
  phone?: string;
  display_phone?: string;
  distance?: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  is_closed: boolean;
  // Search endpoint returns business_hours, not hours
  business_hours?: {
    open: {
      day: number;
      start: string;
      end: string;
      is_overnight: boolean;
    }[];
    hours_type: string;
    is_open_now: boolean;
  }[];
  // Details endpoint returns hours
  hours?: {
    open: {
      day: number;
      start: string;
      end: string;
      is_overnight: boolean;
    }[];
    hours_type: string;
    is_open_now: boolean;
  }[];
  image_url?: string;
  url?: string;
  attributes?: {
    menu_url?: string;
  };
}

interface YelpSearchResponse {
  businesses: YelpBusiness[];
  total: number;
}

export class YelpService {
  private apiKey: string;
  private baseUrl = "https://api.yelp.com/v3";

  constructor() {
    this.apiKey = process.env.YELP_API_KEY || "";
    if (!this.apiKey) {
      console.warn("YELP_API_KEY not set - Yelp service will not work");
    }
  }

  async searchPlaces(
    location: UserLocation | null,
    options: {
      term?: string;
      categories?: string;
      filters?: PlaceFilters;
      attributes?: PlaceAttributes;
      sortBy?: SortBy;
      limit?: number;
      radius?: number;
      locationName?: string; // Search by city/area name instead of coordinates
    } = {}
  ): Promise<Place[]> {
    const params = new URLSearchParams({
      limit: (options.limit || 20).toString(),
      sort_by: options.sortBy || "best_match",
    });

    // Use location name OR coordinates (location name takes priority if provided)
    if (options.locationName) {
      params.set("location", options.locationName);
    } else if (location) {
      params.set("latitude", location.latitude.toString());
      params.set("longitude", location.longitude.toString());
      params.set(
        "radius",
        (options.radius || options.filters?.distance || 5000).toString()
      );
    } else {
      throw new Error(
        "Either location coordinates or locationName is required"
      );
    }

    if (options.term) {
      params.set("term", options.term);
    }

    if (options.categories) {
      params.set("categories", options.categories);
    }

    if (options.filters?.openNow) {
      params.set("open_now", "true");
    }

    if (options.filters?.priceLevel && options.filters.priceLevel.length > 0) {
      params.set("price", options.filters.priceLevel.join(","));
    }

    // Add attribute filters (Yelp uses comma-separated attributes)
    // Note: dogs_allowed is a premium filter, not available on free tier
    const yelpAttributes: string[] = [];
    if (options.attributes?.wheelchairAccessible) {
      yelpAttributes.push("wheelchair_accessible");
    }
    if (options.attributes?.genderNeutralRestrooms) {
      yelpAttributes.push("gender_neutral_restrooms");
    }
    if (options.attributes?.openToAll) {
      yelpAttributes.push("open_to_all");
    }
    // dogs_allowed requires Yelp premium - skip it
    if (yelpAttributes.length > 0) {
      params.set("attributes", yelpAttributes.join(","));
    }

    const response = await fetch(
      `${this.baseUrl}/businesses/search?${params}`,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Yelp API error:", error);
      throw new Error(`Yelp API error: ${response.status}`);
    }

    const data: YelpSearchResponse = await response.json();

    // Transform business data (reviews require paid Yelp plan, so we skip)
    return data.businesses.map((b) => this.transformBusiness(b));
  }

  async getBusinessDetails(businessId: string): Promise<Place | null> {
    const response = await fetch(`${this.baseUrl}/businesses/${businessId}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Yelp API error: ${response.status}`);
    }

    const business: YelpBusiness = await response.json();
    return this.transformBusiness(business);
  }

  async searchByCategory(
    location: UserLocation | null,
    category: "restaurants" | "cafes" | "bars",
    cuisine?: string,
    filters?: PlaceFilters,
    locationName?: string,
    sortBy?: SortBy,
    attributes?: PlaceAttributes
  ): Promise<Place[]> {
    const categoryMap = {
      restaurants: "restaurants",
      cafes: "coffee,cafes",
      bars: "bars,pubs",
    };

    let term = cuisine || "";

    return this.searchPlaces(location, {
      term,
      categories: categoryMap[category],
      filters,
      locationName,
      sortBy,
      attributes,
    });
  }

  private transformBusiness(business: YelpBusiness): Place {
    // Use business_hours (search endpoint) or hours (details endpoint)
    const hoursData = business.business_hours?.[0] || business.hours?.[0];

    const hours: DayHours[] =
      hoursData?.open.map((h) => ({
        day: h.day,
        start: h.start,
        end: h.end,
        isOvernight: h.is_overnight,
      })) || [];

    return {
      id: business.id,
      name: business.name,
      categories: business.categories.map((c) => c.title),
      rating: business.rating,
      reviewCount: business.review_count,
      priceLevel: business.price,
      address: business.location.address1,
      city: `${business.location.city}, ${business.location.state}`,
      phone: business.display_phone,
      distance: business.distance,
      coordinates: {
        latitude: business.coordinates.latitude,
        longitude: business.coordinates.longitude,
      },
      isOpenNow: hoursData?.is_open_now,
      hours,
      imageUrl: business.image_url,
      url: business.url,
      menuUrl: business.attributes?.menu_url,
    };
  }

  // Build search term from intent entities
  buildSearchTerm(entities: {
    cuisine?: string;
    dish?: string;
    query?: string;
  }): string {
    const parts: string[] = [];

    if (entities.dish) {
      parts.push(entities.dish);
    }
    if (entities.cuisine) {
      parts.push(entities.cuisine);
    }

    return parts.length > 0 ? parts.join(" ") : entities.query || "";
  }
}

export const yelpService = new YelpService();
