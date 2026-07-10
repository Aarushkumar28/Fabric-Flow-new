import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { normalizeEmptyStrings } from './normalize-empty-strings.util';

export type PrismaTransaction = Prisma.TransactionClient;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        'DATABASE_URL is not set. ' +
          'Copy apps/textile-flow-svc/.env.example to .env and fill in your Supabase credentials.',
      );
    }

    const pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }, // required for Supabase
    });

    const adapter = new PrismaPg(pool);
    super({ adapter });

    const extendedClient = this.$extends({
      query: {
        $allModels: {
          async $allOperations({ operation, args, query }) {
            if (operation === 'create' || operation === 'update') {
              const typedArgs = args as { data?: unknown };
              if (typedArgs.data) {
                typedArgs.data = normalizeEmptyStrings(typedArgs.data);
              }
            }
            return query(args);
          },
        },
      },
    });

    return new Proxy(this, {
      get: (target, prop) => {
        if (prop in extendedClient) {
          return (extendedClient as Record<string | symbol, unknown>)[prop];
        }
        return (target as Record<string | symbol, unknown>)[prop];
      },
    });
  }

  async onModuleInit() {
    try {
      this.logger.log('Connecting to Supabase PostgreSQL…');
      await this.$connect();
      this.logger.log('Database connection established.');
    } catch (err) {
      this.logger.error('Database connection failed:', err);
      throw err;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
