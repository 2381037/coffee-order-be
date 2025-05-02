// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MenuModule } from './menu/menu.module';
import { OrdersModule } from './orders/orders.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // Pastikan ConfigModule diimpor
      inject: [ConfigService], // Inject ConfigService
      useFactory: (configService: ConfigService) => {
        // FIX: Baca variabel individual dari ConfigService
        const host = configService.get<string>('POSTGRES_HOST');
        const port = configService.get<number>('POSTGRES_PORT'); // ConfigService bisa parse number
        const username = configService.get<string>('POSTGRES_USER');
        const password = configService.get<string>('POSTGRES_PASSWORD');
        const database = configService.get<string>('POSTGRES_DATABASE');

        // Validasi sederhana (opsional tapi bagus)
        if (!host || !port || !username || !password || !database) {
          throw new Error(
            'Missing database configuration in environment variables!',
          );
        }

        return {
          type: 'postgres',
          // FIX: Gunakan variabel individual
          host: host,
          port: port,
          username: username,
          password: password,
          database: database,
          // FIX: Path entities sebaiknya menunjuk ke source saat runtime
          // atau gunakan autoLoadEntities
          // entities: [__dirname + '/../**/*.entity{.ts,.js}'], // Path relatif dari dist/src/app.module.js
          autoLoadEntities: true, // Lebih mudah, Nest akan mencari entitas
          synchronize: false, // Sangat penting di production! Gunakan migrasi.
          ssl: {
            rejectUnauthorized: false, // Untuk Neon/Vercel
          },
          logging: true, // Atau sesuaikan level logging
        };
      },
    }),
    AuthModule,
    UsersModule,
    MenuModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
