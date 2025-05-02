import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Public } from '../auth/decorators/public.decorator';
import { MenuItemQueryDto } from './dto/menu-item-query.dto';
import { MenuItem } from './entities/menu-item.entity';

@ApiTags('Menu')
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post()
  @UseGuards(RolesGuard) // Requires JWT and Role Check
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new menu item (Admin Only)' })
  @ApiResponse({
    status: 201,
    description: 'Menu item created.',
    type: MenuItem,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  create(@Body() createMenuItemDto: CreateMenuItemDto): Promise<MenuItem> {
    return this.menuService.create(createMenuItemDto);
  }

  @Public() // Publicly accessible
  @Get()
  @ApiOperation({ summary: 'Get all available menu items' })
  @ApiQuery({ type: MenuItemQueryDto }) // Documents query parameters from DTO
  @ApiResponse({
    status: 200,
    description: 'List of menu items.',
    type: [MenuItem],
  }) // Improve response type with pagination wrapper later
  findAll(
    @Query() queryDto: MenuItemQueryDto,
  ): Promise<{ data: MenuItem[]; total: number; page: number; limit: number }> {
    return this.menuService.findAll(queryDto);
  }

  @Public() // Publicly accessible
  @Get(':id')
  @ApiOperation({ summary: 'Get a specific menu item by ID' })
  @ApiParam({ name: 'id', description: 'Menu Item ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Menu item details.',
    type: MenuItem,
  })
  @ApiResponse({ status: 404, description: 'Menu item not found.' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<MenuItem> {
    return this.menuService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a menu item (Admin Only)' })
  @ApiParam({ name: 'id', description: 'Menu Item ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Menu item updated.',
    type: MenuItem,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Menu item not found.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMenuItemDto: UpdateMenuItemDto,
  ): Promise<MenuItem> {
    return this.menuService.update(id, updateMenuItemDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a menu item (Admin Only)' })
  @ApiParam({ name: 'id', description: 'Menu Item ID', type: Number })
  @ApiResponse({ status: 204, description: 'Menu item deleted.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Menu item not found.' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.menuService.remove(id);
    // No content should be returned on successful DELETE
  }
}
