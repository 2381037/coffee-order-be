import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsUrl,
} from 'class-validator';
import { MenuItemCategory } from '../entities/menu-item.entity';

export class CreateMenuItemDto {
  @ApiProperty({ example: 'Espresso', description: 'Name of the menu item' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Strong single shot coffee',
    description: 'Description of the menu item',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 2.5, description: 'Price of the menu item' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsNotEmpty()
  price: number;

  @ApiProperty({
    enum: MenuItemCategory,
    example: MenuItemCategory.HOT,
    description: 'Category of the menu item',
  })
  @IsEnum(MenuItemCategory)
  @IsNotEmpty()
  category: MenuItemCategory;

  @ApiProperty({
    example: true,
    description: 'Is the item currently available?',
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  is_available?: boolean = true;

  @ApiProperty({
    example: 'https://example.com/images/espresso.jpg',
    description: 'URL of the item image',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  image_url?: string;
}
