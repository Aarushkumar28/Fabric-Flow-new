import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  createRemoteJWKSet,
  decodeProtectedHeader,
  jwtVerify,
  type JWTPayload,
  type JWTVerifyResult,
} from 'jose';

type AuthUser = {
  id: string;
  email?: string;
  role: string;
};

@Injectable()
export class AuthService {
  private readonly supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  private readonly issuer = this.supabaseUrl
    ? `${this.supabaseUrl.replace(/\/+$/, '')}/auth/v1`
    : undefined;
  private readonly jwtSecret = process.env.SUPABASE_JWT_SECRET;
  private readonly jwks = this.issuer
    ? createRemoteJWKSet(new URL(`${this.issuer}/.well-known/jwks.json`))
    : null;

  async verify(token: string): Promise<AuthUser> {
    const payload = await this.verifyToken(token);

    const subject = payload.sub;
    if (!subject) {
      throw new UnauthorizedException('Token subject is missing');
    }

    const email = typeof payload.email === 'string' ? payload.email : undefined;
    const appMetadataRole =
      this.isObject(payload.app_metadata) &&
      typeof payload.app_metadata.role === 'string'
        ? payload.app_metadata.role
        : undefined;
    const claimRole =
      typeof payload.role === 'string' ? payload.role : undefined;

    return {
      id: subject,
      email,
      role: appMetadataRole ?? claimRole ?? 'authenticated',
    };
  }

  private async verifyToken(token: string): Promise<JWTPayload> {
    if (!this.issuer) {
      throw new InternalServerErrorException(
        'SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL must be configured',
      );
    }

    const header = decodeProtectedHeader(token);
    const algorithm = header.alg;

    let verified: JWTVerifyResult<JWTPayload>;

    try {
      if (algorithm?.startsWith('HS')) {
        if (!this.jwtSecret) {
          throw new InternalServerErrorException(
            'SUPABASE_JWT_SECRET must be configured for HS256 token verification',
          );
        }

        verified = await jwtVerify(
          token,
          new TextEncoder().encode(this.jwtSecret),
          {
            issuer: this.issuer,
            audience: 'authenticated',
          },
        );
      } else {
        if (!this.jwks) {
          throw new InternalServerErrorException(
            'Supabase JWKS URL could not be initialized',
          );
        }

        verified = await jwtVerify(token, this.jwks, {
          issuer: this.issuer,
          audience: 'authenticated',
        });
      }
    } catch (error) {
      if (
        error instanceof InternalServerErrorException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      throw new UnauthorizedException('Invalid or expired Supabase token');
    }

    return verified.payload;
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
