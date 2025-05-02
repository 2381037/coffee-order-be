import { PartialType } from '@nestjs/swagger'; // Or @nestjs/mapped-types
import { CreateMenuItemDto } from './create-menu-item.dto';

// PartialType makes all properties of CreateMenuItemDto optional
export class UpdateMenuItemDto extends PartialType(CreateMenuItemDto) {}
