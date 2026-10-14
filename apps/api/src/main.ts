import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { json, urlencoded } from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/http-exception.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    // Disable Nest's built-in body parsers so we can register our own
    // with larger limits. Needed for base64 image payloads from the admin app.
    bodyParser: false,
  });

  // ─── Body parsers with generous limits ───
  // 25 MB covers base64-encoded images (5 MB raw × ~1.33 inflation × headroom).
  // When Cloudinary is configured, images upload directly from the browser
  // and the API only receives short URLs — this limit becomes irrelevant.
  app.use(json({ limit: "25mb" }));
  app.use(urlencoded({ extended: true, limit: "25mb" }));

  const config = app.get(ConfigService);
  const port = config.get<number>("port")!;
  const apiPrefix = config.get<string>("apiPrefix")!;
  const corsOrigins = config.get<string[]>("corsOrigins")!;
  const nodeEnv = config.get<string>("nodeEnv")!;

  // ─── Security ───
  app.use(helmet());
  app.use(cookieParser());

  // ─── CORS — needs credentials for httpOnly cookies ───
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // ─── Global prefix ───
  app.setGlobalPrefix(apiPrefix);

  // ─── Global pipes / filters / interceptors ───
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  // ─── Swagger (dev only) ───
  if (nodeEnv !== "production") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Baby Shop API")
      .setDescription("REST API for the Baby Shop e-commerce platform")
      .setVersion("1.0")
      .addCookieAuth("access_token")
      .build();
    const doc = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, doc);
  }

  // ─── Start ───
  await app.listen(port);

  const logger = new Logger("Bootstrap");
  logger.log(`🚀 API running on http://localhost:${port}/${apiPrefix}`);
  if (nodeEnv !== "production") {
    logger.log(`📘 Swagger docs at http://localhost:${port}/${apiPrefix}/docs`);
  }
}

bootstrap();
