import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { MenuItem } from './entities/menu-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MenuItem])], // Register MenuItem entity
  controllers: [MenuController],
  providers: [MenuService],
  exports: [MenuService], // Export if needed by other modules (e.g., Orders)
})
export class MenuModule {}
