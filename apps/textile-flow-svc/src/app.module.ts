import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { MillsModule } from './mills/mills.module';
import { KnittersModule } from './knitters/knitters.module';
import { DyersModule } from './dyers/dyers.module';
import { CompactersModule } from './compacters/compacters.module';
import { ColoursModule } from './colours/colours.module';

import { YarnLotsModule } from './yarn-lots/yarn-lots.module';
import { KnitterStockModule } from './knitter-stock/knitter-stock.module';
import { DeliveryNotesModule } from './delivery-notes/delivery-notes.module';
import { MemosModule } from './memos/memos.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { KnittingsModule } from './knittings/knittings.module';
import { KnittingLotsModule } from './knitting-lots/knitting-lots.module';
import { DyeingsModule } from './dyeings/dyeings.module';
import { DyeingOrdersModule } from './dyeing-orders/dyeing-orders.module';
import { CompactingsModule } from './compactings/compactings.module';
import { InhouseKnittedFabricsModule } from './inhouse-knitted-fabrics/inhouse-knitted-fabrics.module';
import { GreyFabricLotsModule } from './grey-fabric-lots/grey-fabric-lots.module';
import { WorkflowModule } from './workflow/workflow.module';
import { YarnInwardModule } from './yarn-inward/yarn-inward.module';
import { KnitterProgramsModule } from './knitter-programs/knitter-programs.module';
import { DyeingDispatchModule } from './dyeing-dispatch/dyeing-dispatch.module';
import { DyeingProgramsModule } from './dyeing-programs/dyeing-programs.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { KnittingModule } from './knitting/knitting.module';
import { InventoryModule } from './inventory/inventory.module';
import { LotTrackerModule } from './lot-tracker/lot-tracker.module';
import { ProductionPlanningModule } from './production-planning/production-planning.module';
import { GreyFabricInwardModule } from './grey-fabric-inward/grey-fabric-inward.module';

import { AuthModule } from './auth/auth.module';
// JwtAuthGuard kept in codebase but NOT registered globally — re-enable via
// APP_GUARD when a real login flow is implemented on the frontend.
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MillsModule,
    KnittersModule,
    DyersModule,
    CompactersModule,
    ColoursModule,

    YarnLotsModule,
    KnitterStockModule,
    DeliveryNotesModule,
    MemosModule,
    PurchaseOrdersModule,
    KnittingsModule,
    KnittingLotsModule,
    DyeingsModule,
    DyeingOrdersModule,
    CompactingsModule,
    InhouseKnittedFabricsModule,
    GreyFabricLotsModule,
    WorkflowModule,
    YarnInwardModule,
    KnitterProgramsModule,
    DyeingDispatchModule,
    DyeingProgramsModule,
    AuditLogsModule,
    KnittingModule,
    InventoryModule,
    LotTrackerModule,
    ProductionPlanningModule,
    GreyFabricInwardModule,
  ],

  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
