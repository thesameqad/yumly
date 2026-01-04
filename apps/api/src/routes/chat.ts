import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { sessionService } from "../services/session.js";
import { intentRouter } from "../services/intentRouter.js";
import { yelpService } from "../services/yelp.js";
import { yelpAiChatService } from "../services/yelpAiChat.js";
import { embeddingsService } from "../services/embeddings.js";
import { responseGenerator } from "../services/responseGenerator.js";
import type {
  ChatRequest,
  ChatResponse,
  ChatMessage,
  LLMModelKey,
  EmbeddingProvider,
  UserLocation,
} from "@yumly/shared";

const router = Router();

// POST /api/chat - Main chat endpoint
router.post("/chat", async (req: Request, res: Response) => {
  try {
    const body: ChatRequest = req.body;
    const {
      message,
      location,
      selectedModel,
      selectedEmbedding,
      deepResearch,
    } = body;
    let { userId } = body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Get or create session
    let session = userId ? sessionService.getSession(userId) : null;
    if (!session) {
      session = sessionService.createSession();
      userId = session.userId;
    }

    // Update session with preferences if provided
    const updates: {
      selectedModel?: LLMModelKey;
      selectedEmbedding?: EmbeddingProvider;
      location?: UserLocation;
    } = {};

    if (selectedModel) updates.selectedModel = selectedModel;
    if (selectedEmbedding) updates.selectedEmbedding = selectedEmbedding;
    if (location) updates.location = location;

    if (Object.keys(updates).length > 0) {
      sessionService.updateSession(userId!, updates);
      Object.assign(session, updates);
    }

    // Save user message
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: "user",
      content: message,
      timestamp: Date.now(),
    };
    sessionService.addMessage(userId!, userMessage);

    console.log(
      "Route is started and the User message saved to session:",
      userMessage
    );

    // Parse intent
    const intent = await intentRouter.parseIntent(
      message,
      session.selectedModel
    );

    let responseText: string;
    let places: ChatResponse["places"] = undefined;

    // Handle place_details intent - user asking about a specific place
    if (intentRouter.isPlaceDetailsIntent(intent)) {
      const placeName = intent.entities.placeName!;
      const locationHint = intent.entities.location;
      // The query field often contains the full address, extract it
      const queryText = intent.entities.query || "";
      // Try to extract address from query (e.g., "Owl Bar at 6363 Dallas Pkwy Suite 120, Frisco, TX 75034")
      const addressMatch = queryText.match(/at\s+([^,]+(?:,\s*[^,]+)*)/i);
      const addressFromQuery = addressMatch
        ? addressMatch[1].trim()
        : undefined;

      console.log(
        `Place details requested for: ${placeName}`,
        addressFromQuery
          ? `at ${addressFromQuery}`
          : locationHint
          ? `near ${locationHint}`
          : ""
      );

      // Get rich details using Yelp AI Chat - use address from query if available
      const enrichment = await yelpAiChatService.getPlaceDetails(
        placeName,
        addressFromQuery,
        locationHint
      );

      if (enrichment) {
        // Format the enrichment data into a nice response
        responseText = enrichment.description;

        // Add extra context if available
        if (enrichment.vibes.length > 0 || enrichment.amenities.length > 0) {
          responseText += "\n\n";
          if (enrichment.vibes.length > 0) {
            responseText += `**Atmosphere:** ${enrichment.vibes.join(", ")}\n`;
          }
          if (enrichment.amenities.length > 0) {
            responseText += `**Amenities:** ${enrichment.amenities.join(", ")}`;
          }
        }

        responseText +=
          "\n\nWould you like me to find similar places nearby, or do you have any other questions about this location?";
      } else {
        responseText = `I couldn't find detailed information about "${placeName}". Could you provide more details like the city or address? Or would you like me to search for similar places?`;
      }
    }
    // Handle search intent
    else if (intentRouter.isSearchIntent(intent)) {
      const userLocation = session.location || location;
      const locationName = intent.entities.location; // Extracted from query (e.g., "Frisco")
      const needsUserLocation = intentRouter.needsLocation(intent);

      // Only require geolocation if query implies "near me" and no location was extracted
      if (needsUserLocation && !userLocation) {
        responseText =
          "I'd love to help you find great places nearby! Could you share your location so I can find options near you? You can click the location button to enable location sharing.";
      } else {
        // Search for places - use location name if provided, otherwise user coordinates
        const searchTerm = yelpService.buildSearchTerm(intent.entities);
        const sortBy = intent.entities.sortBy || "best_match";
        const attributes = intent.entities.attributes;

        console.log(
          "Searching Yelp with term:",
          searchTerm,
          "filters:",
          intent.entities.filters,
          "sortBy:",
          sortBy,
          "attributes:",
          attributes,
          "location:",
          locationName
        );

        const searchResults = await yelpService.searchPlaces(
          locationName ? null : userLocation ?? null,
          {
            term: searchTerm,
            filters: intent.entities.filters,
            locationName: locationName || undefined,
            sortBy,
            attributes,
          }
        );

        if (searchResults.length === 0) {
          responseText = await responseGenerator.generateNoResultsResponse(
            message,
            session.selectedModel
          );
        } else {
          console.log(
            `Found ${searchResults.length} places from Yelp`,
            searchResults
          );

          let rankedPlaces;

          // Deep Research Mode: Enrich with Yelp AI Chat + use embeddings for ranking
          if (deepResearch) {
            console.log("🔬 Deep Research Mode enabled - enriching places...");

            // Enrich top 5 places with detailed data
            const enrichments = await yelpAiChatService.enrichPlaces(
              searchResults,
              5
            );

            // Build rich text descriptions for embedding comparison
            const enrichedTexts: string[] = [];
            for (const place of searchResults.slice(0, 5)) {
              const enrichment = enrichments.get(place.id);
              if (enrichment) {
                enrichedTexts.push(
                  yelpAiChatService.buildEmbeddingText(place, enrichment)
                );
              } else {
                enrichedTexts.push(
                  `${place.name}. ${place.categories.join(", ")}`
                );
              }
            }

            // Rank by embeddings using enriched text
            rankedPlaces = await embeddingsService.rankPlacesWithTexts(
              intent.entities.query || message,
              searchResults.slice(0, 5),
              enrichedTexts,
              session.selectedEmbedding
            );

            console.log(
              `Deep Research: Ranked ${rankedPlaces.length} places with enriched embeddings`
            );

            // Generate detailed deep research response
            responseText = await responseGenerator.generateDeepResearchResponse(
              message,
              rankedPlaces,
              enrichments,
              session.selectedModel,
              {
                dish: intent.entities.dish,
                cuisine: intent.entities.cuisine,
                sortBy: intent.entities.sortBy,
              }
            );
          } else {
            // Normal mode: Use Yelp's built-in ranking (embeddings disabled)
            rankedPlaces = await embeddingsService.rankPlaces(
              intent.entities.query || message,
              searchResults,
              session.selectedEmbedding
            );
            console.log(
              `Ranked ${rankedPlaces.length} places by embeddings`,
              rankedPlaces
            );

            // Get chat history for context
            const history = sessionService.getChatHistory(userId!, 6);
            const chatHistory = history
              .filter((m) => m.role !== "system")
              .map((m) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
              }));

            // Generate response
            responseText = await responseGenerator.generateResponse(
              message,
              rankedPlaces,
              session.selectedModel,
              {
                chatHistory,
                dish: intent.entities.dish,
                cuisine: intent.entities.cuisine,
                sortBy: intent.entities.sortBy,
              }
            );
          }

          places = rankedPlaces.slice(0, 5);
        }
      }
    } else {
      // General chat
      const history = sessionService.getChatHistory(userId!, 6);
      const chatHistory = history
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      responseText = await responseGenerator.generateGeneralResponse(
        message,
        session.selectedModel,
        chatHistory
      );
    }

    // Save assistant message
    const assistantMessage: ChatMessage = {
      id: uuidv4(),
      role: "assistant",
      content: responseText,
      timestamp: Date.now(),
    };
    sessionService.addMessage(userId!, assistantMessage);

    console.log(
      "Assistant message generated and saved to session, Final response with places returns to the frontend:",
      responseText,
      places,
      intent
    );

    const response: ChatResponse = {
      message: responseText,
      userId: userId!,
      places,
      intent,
    };

    res.json(response);
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Failed to process message" });
  }
});

// GET /api/session/:userId - Get session info
router.get("/session/:userId", (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const session = sessionService.getSession(userId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json(session);
  } catch (error) {
    console.error("Session error:", error);
    res.status(500).json({ error: "Failed to get session" });
  }
});

// GET /api/history/:userId - Get chat history
router.get("/history/:userId", (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const history = sessionService.getChatHistory(userId, limit);
    res.json({ messages: history });
  } catch (error) {
    console.error("History error:", error);
    res.status(500).json({ error: "Failed to get history" });
  }
});

// DELETE /api/history/:userId - Clear chat history
router.delete("/history/:userId", (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    sessionService.clearChatHistory(userId);
    res.json({ success: true });
  } catch (error) {
    console.error("Clear history error:", error);
    res.status(500).json({ error: "Failed to clear history" });
  }
});

// POST /api/location - Update user location
router.post("/location", (req: Request, res: Response) => {
  try {
    const { userId, location } = req.body;

    if (!userId || !location) {
      return res.status(400).json({ error: "userId and location required" });
    }

    sessionService.updateLocation(userId, {
      ...location,
      timestamp: Date.now(),
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Location error:", error);
    res.status(500).json({ error: "Failed to update location" });
  }
});

export default router;
