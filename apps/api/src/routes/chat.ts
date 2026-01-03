import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { sessionService } from "../services/session.js";
import { intentRouter } from "../services/intentRouter.js";
import { yelpService } from "../services/yelp.js";
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
    const { message, location, selectedModel, selectedEmbedding } = body;
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

    // Parse intent
    const intent = await intentRouter.parseIntent(
      message,
      session.selectedModel
    );

    let responseText: string;
    let places: ChatResponse["places"] = undefined;

    // Handle based on intent
    if (intentRouter.isSearchIntent(intent)) {
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
        const searchResults = await yelpService.searchPlaces(
          locationName ? null : userLocation,
          {
            term: searchTerm,
            filters: intent.entities.filters,
            locationName: locationName || undefined,
          }
        );

        if (searchResults.length === 0) {
          responseText = await responseGenerator.generateNoResultsResponse(
            message,
            session.selectedModel
          );
        } else {
          // Rank by embeddings
          const rankedPlaces = await embeddingsService.rankPlaces(
            intent.entities.query || message,
            searchResults,
            session.selectedEmbedding
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
            }
          );

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
