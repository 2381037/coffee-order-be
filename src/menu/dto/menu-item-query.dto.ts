import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsBooleanString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer'; // For type conversion
import { MenuItemCategory } from '../entities/menu-item.entity';

export class MenuItemQueryDto {
  @ApiPropertyOptional({
    enum: MenuItemCategory,
    description: 'Filter by category',
  })
  @IsOptional()
  @IsEnum(MenuItemCategory)
  category?: MenuItemCategory;

  @ApiPropertyOptional({ description: 'Filter by availability (true/false)' })
  @IsOptional()
  @IsBooleanString() // Expect 'true' or 'false' string from query param
  available?: string; // Convert to boolean in service

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number) // Convert query string to number
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number) // Convert query string to number
  @IsInt()
  @Min(1)
  @Max(100) // Limit max items per page
  limit?: number = 10;
}
