import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { analyzeContent, generateCrisisResponse } from "./content-analyzer";
import session from "express-session";
import { z } from "zod";
import { 
  insertMessageSchema, 
  insertCommentSchema, 
  insertCounselorSessionSchema 
} from "@shared/schema";

// Required for express-session
declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "safespeak-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false }, // Set to true in production with HTTPS
    })
  );

  // Set up authentication routes
  setupAuth(app);

  // Messages routes
  app.post("/api/messages", async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { content, isAnonymous, recipientType } = insertMessageSchema
        .omit({ userId: true })
        .parse(req.body);

      // Analyze content for vulgar language and crisis indicators
      const analysisResult = await analyzeContent(content);

      if (analysisResult.isVulgar) {
        return res.status(400).json({
          error: "Message contains inappropriate language",
          vulgarContent: true,
          highlightedContent: analysisResult.highlightedContent,
        });
      }

      // Suicide-related public messages should never be anonymous
      let isActuallyAnonymous = isAnonymous;
      if (analysisResult.isCrisis && analysisResult.crisisType === 'suicide' && recipientType === 'public') {
        isActuallyAnonymous = false;
      }

      // Create the message with crisis info if applicable
      const message = await storage.createMessage({
        content,
        isAnonymous: isActuallyAnonymous,
        recipientType,
        userId: req.user.id,
        isCrisis: analysisResult.isCrisis || false,
        crisisType: analysisResult.crisisType || null,
        notifiedCounselor: false
      });

      // If crisis content is detected
      if (analysisResult.isCrisis && analysisResult.crisisType) {
        const crisisResponse = generateCrisisResponse(analysisResult.crisisType);
        
        // Get user information to notify counselors
        const user = await storage.getUser(req.user.id);
        
        // TODO: In a real implementation, we would send WhatsApp notifications to counselors here
        // For now, we'll just mark the message as notified
        if (user && user.whatsappNumber) {
          // Send notification to counselors via WhatsApp API
          // This would typically use Twilio or similar service
          console.log(`CRISIS ALERT: ${analysisResult.crisisType} message from ${user.name || 'Anonymous user'}`);
          console.log(`Contact via WhatsApp: ${user.whatsappNumber}`);
          
          // Mark message as having notified counselors
          await storage.updateMessage(message.id, { notifiedCounselor: true });
        }
        
        return res.status(201).json({
          message,
          crisis: {
            detected: true,
            type: analysisResult.crisisType,
            response: crisisResponse,
            forceIdentified: analysisResult.crisisType === 'suicide' && recipientType === 'public'
          },
        });
      }

      res.status(201).json({ message });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create message" });
      }
    }
  });

  // Get messages by recipient type
  app.get("/api/messages/:recipientType", async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { recipientType } = req.params;
    if (!["public", "faculty", "counselor"].includes(recipientType)) {
      return res.status(400).json({ error: "Invalid recipient type" });
    }

    try {
      // Check if user has access to this recipient type
      if (recipientType === 'faculty' && req.user.profession !== 'faculty') {
        return res.status(403).json({ error: "You don't have access to faculty messages" });
      }
      
      if (recipientType === 'counselor' && req.user.profession !== 'counselor') {
        return res.status(403).json({ error: "You don't have access to counselor messages" });
      }
      
      const messages = await storage.getMessagesByRecipientType(recipientType);
      
      // Enrich messages with comments
      const enrichedMessages = await Promise.all(
        messages.map(async (message) => {
          const comments = await storage.getCommentsByMessageId(message.id);
          return { ...message, comments };
        })
      );

      res.status(200).json(enrichedMessages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Get all messages (only messages the user has access to)
  app.get("/api/messages", async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      let messages = [];
      
      // Always get public messages
      const publicMessages = await storage.getMessagesByRecipientType('public');
      messages = [...publicMessages];
      
      // Add faculty messages if user is faculty
      if (req.user.profession === 'faculty') {
        const facultyMessages = await storage.getMessagesByRecipientType('faculty');
        messages = [...messages, ...facultyMessages];
      }
      
      // Add counselor messages if user is counselor
      if (req.user.profession === 'counselor') {
        const counselorMessages = await storage.getMessagesByRecipientType('counselor');
        messages = [...messages, ...counselorMessages];
      }
      
      // Sort messages by creation date (newest first)
      messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Enrich messages with comments
      const enrichedMessages = await Promise.all(
        messages.map(async (message) => {
          const comments = await storage.getCommentsByMessageId(message.id);
          return { ...message, comments };
        })
      );

      res.status(200).json(enrichedMessages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Add comment to a message
  app.post("/api/messages/:messageId/comments", async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const messageId = parseInt(req.params.messageId);
    if (isNaN(messageId)) {
      return res.status(400).json({ error: "Invalid message ID" });
    }

    try {
      const { content } = insertCommentSchema.omit({ userId: true, messageId: true }).parse(req.body);
      
      // Verify message exists
      const message = await storage.getMessageById(messageId);
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }
      
      // Check if user has access to comment on this message type
      if (message.recipientType === 'faculty' && req.user.profession !== 'faculty') {
        return res.status(403).json({ error: "You don't have permission to comment on faculty messages" });
      }
      
      if (message.recipientType === 'counselor' && req.user.profession !== 'counselor') {
        return res.status(403).json({ error: "You don't have permission to comment on counselor messages" });
      }
      
      // Analyze content for vulgar language
      const analysisResult = await analyzeContent(content);
      if (analysisResult.isVulgar) {
        return res.status(400).json({
          error: "Comment contains inappropriate language",
          vulgarContent: true,
          highlightedContent: analysisResult.highlightedContent,
        });
      }

      const comment = await storage.createComment({
        content,
        userId: req.user.id,
        messageId,
      });

      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create comment" });
      }
    }
  });

  // Faculty routes
  app.get("/api/faculty", async (req: Request, res: Response) => {
    try {
      const faculty = await storage.getFaculty();
      res.status(200).json(faculty);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch faculty" });
    }
  });

  // Counselor routes
  app.get("/api/counselors", async (req: Request, res: Response) => {
    try {
      const counselors = await storage.getCounselors();
      res.status(200).json(counselors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch counselors" });
    }
  });

  // Counselor session routes
  app.post("/api/counselor-sessions", async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const parsedData = insertCounselorSessionSchema
        .omit({ userId: true })
        .parse(req.body);
      
      const sessionData = {
        counselorId: parsedData.counselorId,
        date: parsedData.date,
        time: parsedData.time,
        userId: req.user.id,
        isBooked: true,
      };

      const session = await storage.createCounselorSession(sessionData);

      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to book session" });
      }
    }
  });

  // Get user's counselor sessions
  app.get("/api/counselor-sessions", async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const sessions = await storage.getCounselorSessionsByUserId(req.user.id);
      res.status(200).json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
