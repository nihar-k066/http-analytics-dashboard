import { users, type User, type InsertUser, type HttpLog, type InsertHttpLog } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getHttpLogs(startDate: Date, endDate: Date): Promise<HttpLog[]>;
  addHttpLog(log: InsertHttpLog): Promise<HttpLog>;
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private httpLogs: Map<number, HttpLog>;
  currentId: number;
  currentLogId: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.httpLogs = new Map();
    this.currentId = 1;
    this.currentLogId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    // Add some sample HTTP logs
    this.addSampleLogs();
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getHttpLogs(startDate: Date, endDate: Date): Promise<HttpLog[]> {
    return Array.from(this.httpLogs.values()).filter(
      (log) => log.timestamp >= startDate && log.timestamp <= endDate
    );
  }

  async addHttpLog(log: InsertHttpLog): Promise<HttpLog> {
    const id = this.currentLogId++;
    const httpLog: HttpLog = { 
      ...log, 
      id,
      timestamp: new Date()
    };
    this.httpLogs.set(id, httpLog);
    return httpLog;
  }

  private addSampleLogs() {
    const sampleLogs: InsertHttpLog[] = [
      { statusCode: 500, message: "Internal Server Error" },
      { statusCode: 404, message: "Not Found" },
      { statusCode: 403, message: "Forbidden" },
      { statusCode: 401, message: "Unauthorized" },
      { statusCode: 400, message: "Bad Request" },
      { statusCode: 200, message: "OK" },
      { statusCode: 201, message: "Created" },
      { statusCode: 503, message: "Service Unavailable" },
      { statusCode: 502, message: "Bad Gateway" },
      { statusCode: 429, message: "Too Many Requests" }
    ];

    sampleLogs.forEach((log) => {
      this.addHttpLog(log);
    });
  }
}

export const storage = new MemStorage();
