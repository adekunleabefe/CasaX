import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { envValidationSchema } from './config/env.validation';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { LandlordsModule } from './modules/landlords/landlords.module';
import { CaretakersModule } from './modules/caretakers/caretakers.module';
import { ApplicantsModule } from './modules/applicants/applicants.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { TenanciesModule } from './modules/tenancies/tenancies.module';
import { OccupancyModule } from './modules/occupancy/occupancy.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { UnitsModule } from './modules/units/units.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { RemittancesModule } from './modules/remittances/remittances.module';
import { VacanciesModule } from './modules/vacancies/vacancies.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { TenantOnboardingModule } from './modules/tenant-onboarding/tenant-onboarding.module';
import { AgreementsModule } from './modules/agreements/agreements.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema: envValidationSchema,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        redact: [
          'req.headers.authorization',
          'req.headers.cookie',
          'res.headers.set-cookie',
        ],
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    LandlordsModule,
    CaretakersModule,
    ApplicantsModule,
    ApplicationsModule,
    TenanciesModule,
    OccupancyModule,
    PropertiesModule,
    UnitsModule,
    PaymentsModule,
    RemittancesModule,
    VacanciesModule,
    MaintenanceModule,
    SubscriptionsModule,
    NotificationsModule,
    AdminModule,
    DashboardModule,
    TenantOnboardingModule,
    AgreementsModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule {}
