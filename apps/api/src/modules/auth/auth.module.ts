import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { TokenService } from "./token.service";
import { CookieService } from "./cookie.service";
import { UsersModule } from "../users/users.module";
import { MailService } from "./mail.service";

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService, TokenService, CookieService, MailService],
  exports: [AuthService, TokenService, CookieService],
})
export class AuthModule {}
