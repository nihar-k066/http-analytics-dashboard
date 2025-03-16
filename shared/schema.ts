import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const httpLogs = pgTable("http_logs", {
  id: serial("id").primaryKey(),
  statusCode: integer("status_code").notNull(),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertHttpLogSchema = createInsertSchema(httpLogs).pick({
  statusCode: true,
  message: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type HttpLog = typeof httpLogs.$inferSelect;
export type InsertHttpLog = z.infer<typeof insertHttpLogSchema>;
