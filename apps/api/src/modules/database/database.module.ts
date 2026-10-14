import { Global, Module, Logger } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const uri = config.getOrThrow<string>("mongodbUri");
        const logger = new Logger("MongoDB");
        return {
          uri,
          connectionFactory: (connection: any) => {
            connection.on("connected", () =>
              logger.log("✅ MongoDB connected")
            );
            connection.on("error", (err: Error) =>
              logger.error(`MongoDB error: ${err.message}`)
            );
            connection.on("disconnected", () =>
              logger.warn("MongoDB disconnected")
            );
            return connection;
          },
        };
      },
    }),
  ],
})
export class DatabaseModule {}