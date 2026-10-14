import { Global, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "./schemas/user.schema";
import { UsersRepository } from "./users.repository";
import { UsersService } from "./users.service";

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [UsersRepository, UsersService],
  exports: [UsersService, UsersRepository, MongooseModule],
})
export class UsersModule {}