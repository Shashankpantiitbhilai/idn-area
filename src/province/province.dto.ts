import {
  IsAlphanumeric,
  IsNotEmpty,
  IsOptional,
  Length,
} from 'class-validator';
import { EqualsAny } from 'src/common/decorator/EqualsAny';
import { IsNotSymbol } from 'src/common/decorator/IsNotSymbol';

export class ProvinceFindQueries {
  @IsOptional()
  @IsNotSymbol()
  @Length(3, 255)
  name: string;

  @IsOptional()
  @EqualsAny(['code', 'name'])
  sortBy: 'code' | 'name';

  @IsOptional()
  @EqualsAny(['asc', 'desc'])
  sortOrder: 'asc' | 'desc';
}

export class ProvinceFindByCodeParams {
  @IsNotEmpty()
  @IsAlphanumeric()
  @Length(2, 2)
  provinceCode: string;
}

export class ProvinceFindRegencyParams {
  @IsNotEmpty()
  @IsAlphanumeric()
  @Length(2, 2)
  provinceCode: string;
}

export class ProvinceFindRegencyQueries {
  @IsOptional()
  @EqualsAny(['code', 'name'])
  sortBy: 'code' | 'name';

  @IsOptional()
  @EqualsAny(['asc', 'desc'])
  sortOrder: 'asc' | 'desc';
}