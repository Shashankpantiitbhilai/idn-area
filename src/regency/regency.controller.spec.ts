import { getValues, sortArray } from '@/common/utils/array';
import { PrismaService } from '@/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  DistrictTransformed,
  IslandTransformed,
  RegencyTransformed,
} from 'idn-area-data';
import { MockRegencyService } from './__mocks__/regency.service';
import { RegencyController } from './regency.controller';
import { RegencyService } from './regency.service';

describe('RegencyController', () => {
  const testRegencyCode = '1101';

  let regencies: RegencyTransformed[];
  let districts: DistrictTransformed[];
  let islands: IslandTransformed[];
  let controller: RegencyController;

  beforeAll(async () => {
    regencies = await new PrismaService().regency.findMany();
    districts = await new PrismaService().district.findMany();
    islands = await new PrismaService().island.findMany();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegencyController],
      providers: [
        {
          provide: RegencyService,
          useValue: new MockRegencyService(regencies, districts, islands),
        },
      ],
    }).compile();

    controller = module.get<RegencyController>(RegencyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('find', () => {
    const testRegencyName = 'jakarta';
    let filteredRegenciesByName: RegencyTransformed[];

    beforeAll(() => {
      filteredRegenciesByName = regencies.filter((p) =>
        p.name.toLowerCase().includes(testRegencyName.toLowerCase()),
      );
    });

    it('should return all regencies', async () => {
      const testRegencies = await controller.find();

      expect(testRegencies).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: expect.any(String),
            name: expect.any(String),
            provinceCode: expect.any(String),
          }),
        ]),
      );
      expect(testRegencies.length).toEqual(regencies.length);
    });

    it('should return regencies filtered by name', async () => {
      const testRegencies = await controller.find({
        name: testRegencyName,
      });

      expect(testRegencies).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: expect.any(String),
            name: expect.stringMatching(new RegExp(testRegencyName, 'i')),
            provinceCode: expect.any(String),
          }),
        ]),
      );
      expect(testRegencies.length).toEqual(filteredRegenciesByName.length);
    });

    it('should return empty array if there is no regency with the corresponding name', async () => {
      const testRegencies = await controller.find({
        name: 'unknown regency',
      });

      expect(testRegencies).toEqual([]);
    });

    it('should return regencies filtered and sorted by name ascending', async () => {
      const testRegencies = await controller.find({
        name: testRegencyName,
        sortBy: 'name',
      });

      expect(getValues(testRegencies, 'code')).toEqual(
        getValues(sortArray(filteredRegenciesByName, 'name'), 'code'),
      );
    });

    it('should return regencies filtered and sorted by name descending', async () => {
      const testRegencies = await controller.find({
        name: testRegencyName,
        sortBy: 'name',
        sortOrder: 'desc',
      });

      expect(getValues(testRegencies, 'code')).toEqual(
        getValues(sortArray(filteredRegenciesByName, 'name', 'desc'), 'code'),
      );
    });
  });

  describe('findByCode', () => {
    it('should return a regency with matching code', async () => {
      const testRegency = await controller.findByCode({
        code: testRegencyCode,
      });

      expect(testRegency).toEqual(
        expect.objectContaining({
          code: testRegencyCode,
          name: expect.any(String),
          provinceCode: testRegencyCode.slice(0, 2),
        }),
      );
    });

    it('should throw NotFoundException if there is no matching regency', async () => {
      await expect(
        controller.findByCode({ code: '0000' }),
      ).rejects.toThrowError(NotFoundException);
    });
  });

  describe('findDistricts', () => {
    let expectedDistricts: DistrictTransformed[];

    beforeAll(() => {
      expectedDistricts = districts.filter(
        (r) => r.regencyCode === testRegencyCode,
      );
    });

    it('should return all districts in the matching regency', async () => {
      const testDistricts = await controller.findDistricts({
        code: testRegencyCode,
      });

      expect(testDistricts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: expect.stringMatching(
              new RegExp(`^${testRegencyCode}\\d{2}$`),
            ),
            name: expect.any(String),
            regencyCode: testRegencyCode,
          }),
        ]),
      );
      expect(testDistricts.length).toEqual(expectedDistricts.length);
    });

    it('should throw NotFoundException if there is no matching regency', async () => {
      await expect(
        controller.findDistricts({ code: '0000' }),
      ).rejects.toThrowError(NotFoundException);
    });

    it('should return all districts in the matching regency sorted by name ascending', async () => {
      const testDistricts = await controller.findDistricts(
        { code: testRegencyCode },
        { sortBy: 'name', sortOrder: 'asc' },
      );

      expect(getValues(testDistricts, 'code')).toEqual(
        getValues(sortArray(expectedDistricts, 'name'), 'code'),
      );
    });

    it('should return all districts in the matching regency sorted by name descending', async () => {
      const testDistricts = await controller.findDistricts(
        { code: testRegencyCode },
        { sortBy: 'name', sortOrder: 'desc' },
      );

      expect(getValues(testDistricts, 'code')).toEqual(
        getValues(sortArray(expectedDistricts, 'name', 'desc'), 'code'),
      );
    });
  });

  describe('findIslands', () => {
    let expectedIslands: IslandTransformed[];

    beforeAll(() => {
      expectedIslands = islands.filter(
        (r) => r.regencyCode === testRegencyCode,
      );
    });

    it('should return all islands in the matching regency', async () => {
      const testIslands = await controller.findIslands({
        code: testRegencyCode,
      });

      expect(testIslands).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: expect.stringMatching(
              new RegExp(`^${testRegencyCode}\\d{5}$`),
            ),
            coordinate: expect.any(String),
            isOutermostSmall: expect.any(Boolean),
            isPopulated: expect.any(Boolean),
            latitude: expect.any(Number),
            longitude: expect.any(Number),
            name: expect.any(String),
            regencyCode: testRegencyCode,
          }),
        ]),
      );
      expect(testIslands.length).toEqual(expectedIslands.length);
    });

    it('should throw NotFoundException if there is no matching regency', async () => {
      await expect(
        controller.findIslands({ code: '0000' }),
      ).rejects.toThrowError(NotFoundException);
    });

    it('should return all islands in the matching regency sorted by name ascending', async () => {
      const testIslands = await controller.findIslands(
        { code: testRegencyCode },
        { sortBy: 'name', sortOrder: 'asc' },
      );

      expect(getValues(testIslands, 'code')).toEqual(
        getValues(sortArray(expectedIslands, 'name'), 'code'),
      );
    });

    it('should return all islands in the matching regency sorted by name descending', async () => {
      const testIslands = await controller.findIslands(
        { code: testRegencyCode },
        { sortBy: 'name', sortOrder: 'desc' },
      );

      expect(getValues(testIslands, 'code')).toEqual(
        getValues(sortArray(expectedIslands, 'name', 'desc'), 'code'),
      );
    });

    it('should return all islands in the matching regency sorted by coordinate ascending', async () => {
      const testIslands = await controller.findIslands(
        { code: testRegencyCode },
        { sortBy: 'coordinate', sortOrder: 'asc' },
      );

      expect(getValues(testIslands, 'code')).toEqual(
        getValues(sortArray(expectedIslands, 'coordinate'), 'code'),
      );
    });

    it('should return all islands in the matching regency sorted by coordinate descending', async () => {
      const testIslands = await controller.findIslands(
        { code: testRegencyCode },
        { sortBy: 'coordinate', sortOrder: 'desc' },
      );

      expect(getValues(testIslands, 'code')).toEqual(
        getValues(sortArray(expectedIslands, 'coordinate', 'desc'), 'code'),
      );
    });
  });
});
