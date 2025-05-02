import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, Min } from 'class-validator';

export class CreateOrderDetailDto {
  @ApiProperty({ example: 1, description: 'ID of the menu item' })
  @IsInt()
  @IsPositive()
  menuItemId: number;

  @ApiProperty({ example: 2, description: 'Quantity of the menu item' })
  @IsInt()
  @Min(1) // Must order at least 1
  quantity: number;
}
