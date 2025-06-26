import { Express, Request, Response } from "express";
import { storage } from "./storage";
import { 
  loginSchema,
  otpVerificationSchema,
  profileUpdateSchema,
  User,
  LoginData,
  OtpVerification,
  ProfileUpdate
} from "@shared/schema";
import { z } from "zod";
import { randomInt } from "crypto";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Store OTPs in memory (in a real app, use a database with expiration)
interface OtpEntry {
  email: string;
  otp: string;
  createdAt: Date;
}

const otpStore: OtpEntry[] = [];
const OTP_EXPIRY_MINUTES = 10;

/**
 * Generates a 6-digit OTP
 */
function generateOTP(): string {
  return randomInt(100000, 999999).toString();
}

/**
 * Stores an OTP for a given email
 */
function storeOTP(email: string, otp: string): void {
  // Remove any existing OTPs for this email
  const existingIndex = otpStore.findIndex(entry => entry.email === email);
  if (existingIndex !== -1) {
    otpStore.splice(existingIndex, 1);
  }
  
  // Store new OTP
  otpStore.push({
    email,
    otp,
    createdAt: new Date()
  });
}

/**
 * Verifies an OTP for a given email
 */
function verifyOTP(email: string, otp: string): boolean {
  const now = new Date();
  const entry = otpStore.find(entry => entry.email === email && entry.otp === otp);
  
  if (!entry) return false;
  
  // Check if OTP is expired (10 minutes)
  const expiryTime = new Date(entry.createdAt);
  expiryTime.setMinutes(expiryTime.getMinutes() + OTP_EXPIRY_MINUTES);
  
  if (now > expiryTime) return false;
  
  // Remove the OTP after successful verification
  const index = otpStore.findIndex(e => e.email === email);
  otpStore.splice(index, 1);
  
  return true;
}

export function setupAuth(app: Express): void {
  // Login route: Request OTP
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email } = loginSchema.parse(req.body);
      
      // Generate and store OTP
      const otp = generateOTP();
      storeOTP(email, otp);
      
      // In a real app, this would send the OTP via email
      console.log(`OTP for ${email}: ${otp}`);
      
      // For development purposes only, return OTP in response for easy testing
      // In a production environment, this should be removed
      res.status(200).json({ 
        message: "OTP sent to email", 
        email,
        // This allows frontend developers to test without real email integration
        devOtp: otp 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Server error" });
      }
    }
  });
  
  // Verify OTP and create session
  app.post("/api/auth/verify", async (req: Request, res: Response) => {
    try {
      const { email, otp } = otpVerificationSchema.parse(req.body);
      
      // Verify OTP
      if (!verifyOTP(email, otp)) {
        return res.status(401).json({ error: "Invalid or expired OTP" });
      }
      
      // Check if user exists
      let user = await storage.getUserByEmail(email);
      
      // If not, create a new user
      if (!user) {
        user = await storage.createUser({
          email,
          password: "otp-auth", // Not used with OTP auth
          profileComplete: false,
          viewedIntro: false,
        });
      }
      
      // Set user in session
      req.session.userId = user.id;
      
      res.status(200).json({ 
        user,
        needsProfileSetup: !user.profileComplete,
        needsIntro: !user.viewedIntro && user.profileComplete
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Server error" });
      }
    }
  });
  
  // Get current user
  app.get("/api/auth/user", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: "User not found" });
    }
    
    res.status(200).json({ 
      user,
      needsProfileSetup: !user.profileComplete,
      needsIntro: !user.viewedIntro && user.profileComplete
    });
  });
  
  // Update user profile
  app.post("/api/auth/profile", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { name, profession, whatsappNumber } = profileUpdateSchema.parse(req.body);
      
      const updatedUser = await storage.updateUser(req.session.userId, {
        name,
        profession,
        whatsappNumber,
        profileComplete: true
      });
      
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.status(200).json({ 
        user: updatedUser,
        needsProfileSetup: false,
        needsIntro: !updatedUser.viewedIntro
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Server error" });
      }
    }
  });
  
  // Mark intro as viewed
  app.post("/api/auth/intro-viewed", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const updatedUser = await storage.updateUser(req.session.userId, {
      viewedIntro: true
    });
    
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.status(200).json({ 
      user: updatedUser,
      needsProfileSetup: false,
      needsIntro: false
    });
  });
  
  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.status(200).json({ message: "Logged out successfully" });
    });
  });
  
  // Auth middleware for protected routes
  app.use("/api/messages", async (req: Request, res: Response, next) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: "User not found" });
    }
    
    req.user = user;
    next();
  });
}
