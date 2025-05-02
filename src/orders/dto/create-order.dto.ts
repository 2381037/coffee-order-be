import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { CreateOrderDetailDto } from './create-order-detail.dto';

export class CreateOrderDto {
  @ApiProperty({
    type: [CreateOrderDetailDto],
    description: 'List of items in the order',
  })
  @IsArray()
  @ValidateNested({ each: true }) // Validate each item in the array
  @ArrayMinSize(1) // Must order at least one item
  @Type(() => CreateOrderDetailDto) // Ensure nested validation works
  orderDetails: CreateOrderDetailDto[];
}
