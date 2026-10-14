import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";

@Injectable()
export class HealthService {
  constructor(@InjectConnection() private readonly conn: Connection) {}

  async check() {
    const dbState = this.conn.readyState; // 1 = connected
    const dbOk = dbState === 1;
    return {
      status: dbOk ? "ok" : "degraded",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      services: {
        database: dbOk ? "up" : "down",
      },
    };
  }
}