import { Injectable } from '@nestjs/common';
import { Island } from '@prisma/client';
import { getDBProviderFeatures } from '~/utils/db';
import CoordinateConverter from '~/utils/helpers/coordinate-converter';
import { Sorter, SortOptions } from '~/utils/helpers/sorter';
import { PrismaService } from '../common/services/prisma';

export type IslandSortKeys = keyof Island;

@Injectable()
export class IslandService {
  readonly sortHelper: Sorter<IslandSortKeys>;

  constructor(private readonly prisma: PrismaService) {
    this.sortHelper = new Sorter<IslandSortKeys>({
      sortBy: 'code',
      sortOrder: 'asc',
    });
  }

  /**
   * Add decimal latitude and longitude to the island object.
   */
  addDecimalCoordinate(island: Island) {
    const coordinateConverter = new CoordinateConverter();
    const [latitude, longitude] = coordinateConverter.convertToNumber(
      island.coordinate,
    );

    return { ...island, latitude, longitude };
  }

  async find(name = '', sort?: SortOptions<IslandSortKeys>): Promise<Island[]> {
    const islands = await this.prisma.island.findMany({
      where: {
        name: {
          contains: name,
          ...(getDBProviderFeatures()?.filtering?.insensitive && {
            mode: 'insensitive',
          }),
        },
      },
      orderBy: this.sortHelper.object(sort),
    });

    return islands.map(this.addDecimalCoordinate);
  }

  /**
   * Find an island by its code.
   * @param code The island code.
   * @returns An island, or null if there are no match island.
   */
  async findByCode(code: string): Promise<Island | null> {
    const island = await this.prisma.island.findUnique({
      where: {
        code: code,
      },
    });

    if (island) {
      return this.addDecimalCoordinate(island);
    }

    return null;
  }
}