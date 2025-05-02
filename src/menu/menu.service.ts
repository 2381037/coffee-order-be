import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuItem } from './entities/menu-item.entity';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { MenuItemQueryDto } from './dto/menu-item-query.dto';

@Injectable()
export class MenuService {
  private readonly logger = new Logger(MenuService.name);

  constructor(
    @InjectRepository(MenuItem)
    private menuItemRepository: Repository<MenuItem>,
  ) {}

  async create(createMenuItemDto: CreateMenuItemDto): Promise<MenuItem> {
    try {
      const menuItem = this.menuItemRepository.create(createMenuItemDto);
      await this.menuItemRepository.save(menuItem);
      return menuItem;
    } catch (error) {
      this.logger.error(
        `Failed to create menu item: ${JSON.stringify(createMenuItemDto)}`,
        error.stack,
      );
      throw new InternalServerErrorException('Could not create menu item.');
    }
  }

  async findAll(
    queryDto: MenuItemQueryDto,
  ): Promise<{ data: MenuItem[]; total: number; page: number; limit: number }> {
    const { category, available, page = 1, limit = 10 } = queryDto;
    const skip = (page - 1) * limit;

    const query = this.menuItemRepository.createQueryBuilder('menuItem');

    if (category) {
      query.andWhere('menuItem.category = :category', { category });
    }

    if (available !== undefined) {
      // Convert string 'true'/'false' to boolean
      const isAvailable = available === 'true';
      query.andWhere('menuItem.is_available = :isAvailable', { isAvailable });
    }

    try {
      query.orderBy('menuItem.name', 'ASC'); // Default sort
      query.skip(skip).take(limit);

      const [data, total] = await query.getManyAndCount();

      return { data, total, page, limit };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve menu items with query: ${JSON.stringify(queryDto)}`,
        error.stack,
      );
      throw new InternalServerErrorException('Could not retrieve menu items.');
    }
  }

  async findOne(id: number): Promise<MenuItem> {
    const menuItem = await this.menuItemRepository.findOneBy({ id });
    if (!menuItem) {
      throw new NotFoundException(`Menu item with ID ${id} not found`);
    }
    return menuItem;
  }

  async findByIds(ids: number[]): Promise<MenuItem[]> {
    if (!ids || ids.length === 0) {
      return [];
    }
    // Use `findByIds`, which is optimized for this purpose
    return this.menuItemRepository.findByIds(ids);
    // Or use IN operator:
    // return this.menuItemRepository.createQueryBuilder('item')
    //    .where('item.id IN (:...ids)', { ids })
    //    .getMany();
  }

  async update(
    id: number,
    updateMenuItemDto: UpdateMenuItemDto,
  ): Promise<MenuItem> {
    // findOne will throw NotFoundException if item doesn't exist
    const menuItem = await this.findOne(id);

    // Merge the changes from DTO into the existing entity
    this.menuItemRepository.merge(menuItem, updateMenuItemDto);

    try {
      await this.menuItemRepository.save(menuItem);
      return menuItem;
    } catch (error) {
      this.logger.error(
        `Failed to update menu item ${id}: ${JSON.stringify(updateMenuItemDto)}`,
        error.stack,
      );
      throw new InternalServerErrorException('Could not update menu item.');
    }
  }

  async remove(id: number): Promise<void> {
    const result = await this.menuItemRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Menu item with ID ${id} not found`);
    }
    // Consider implications if item is in existing orders (SET NULL relation helps)
  }
}
