import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  profession: text("profession"),
  whatsappNumber: text("whatsapp_number"),
  password: text("password").notNull(),
  profileComplete: boolean("profile_complete").default(false).notNull(),
  viewedIntro: boolean("viewed_intro").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const faculty = pgTable("faculty", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  department: text("department").notNull(),
  email: text("email").notNull(),
  officeHours: text("office_hours").notNull(),
  imageUrl: text("image_url"),
});

export const counselors = pgTable("counselors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  email: text("email").notNull(),
  specialties: text("specialties").notNull(),
  imageUrl: text("image_url"),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  isAnonymous: boolean("is_anonymous").default(false).notNull(),
  userId: integer("user_id").notNull(),
  recipientType: text("recipient_type").notNull(), // "public", "faculty", "counselor"
  isFlagged: boolean("is_flagged").default(false).notNull(),
  flaggedContent: text("flagged_content"),
  isCrisis: boolean("is_crisis").default(false).notNull(),
  crisisType: text("crisis_type"), // "suicide", "depression", "general"
  notifiedCounselor: boolean("notified_counselor").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  userId: integer("user_id").notNull(),
  messageId: integer("message_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const counselorSessions = pgTable("counselor_sessions", {
  id: serial("id").primaryKey(),
  counselorId: integer("counselor_id").notNull(),
  userId: integer("user_id").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  isBooked: boolean("is_booked").default(false).notNull(),
});

// Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  name: true,
  profession: true,
  whatsappNumber: true,
  profileComplete: true,
  viewedIntro: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  content: true,
  isAnonymous: true,
  userId: true,
  recipientType: true,
  isCrisis: true,
  crisisType: true,
  notifiedCounselor: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  content: true,
  userId: true,
  messageId: true,
});

export const insertCounselorSessionSchema = createInsertSchema(counselorSessions).pick({
  counselorId: true,
  userId: true,
  date: true,
  time: true,
  isBooked: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
});

export const otpVerificationSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  profession: z.string().min(1, "Profession is required"),
  whatsappNumber: z.string().min(10, "WhatsApp number must be at least 10 digits")
    .regex(/^\+?[0-9]+$/, "Please enter a valid WhatsApp number"),
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type InsertCounselorSession = z.infer<typeof insertCounselorSessionSchema>;
export type User = typeof users.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Faculty = typeof faculty.$inferSelect;
export type Counselor = typeof counselors.$inferSelect;
export type CounselorSession = typeof counselorSessions.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
export type OtpVerification = z.infer<typeof otpVerificationSchema>;
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
