import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';

type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    email?: string;
    role: string;
  };
};

@Controller('auth')
export class AuthController {
  @Get('me')
  me(@Req() request: AuthenticatedRequest) {
    return {
      user: request.user ?? null,
    };
  }
}
