import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateStoreDto } from './dtos/create-store.dto';
import { Store } from './entities/store.entity';
import { StoresService } from './stores.service';

@Controller('stores')
@ApiTags('stores')
@ApiUnauthorizedResponse({
  description: 'Not logged in',
})
export class StoresController {
  constructor(private storesService: StoresService) {}

  @ApiOperation({ summary: 'get store by id' })
  @HttpCode(HttpStatus.OK)
  @Get(':id')
  @ApiOkResponse({
    description: 'Store has been found',
    type: Store,
  })
  @ApiNotFoundResponse({
    description: 'Store has not been found',
  })
  findById(@Param('id') id: string): Promise<Store> {
    return this.storesService.findOne({ where: { id } });
  }

  @ApiOperation({ summary: 'get all stores' })
  @HttpCode(HttpStatus.OK)
  @Get()
  @ApiOkResponse({
    description: 'Stores have been found',
    type: Store,
    isArray: true,
  })
  findAll(): Promise<Store[]> {
    return this.storesService.findMany();
  }

  @ApiOperation({ summary: 'create a store' })
  @HttpCode(HttpStatus.CREATED)
  @Post()
  @ApiCreatedResponse({
    description: 'Store has been created',
    type: Store,
  })
  @ApiBadRequestResponse({
    description: 'Invalid data',
  })
  create(@Body() createStoreDto: CreateStoreDto): Promise<Store> {
    return this.storesService.create(
      createStoreDto.name,
      createStoreDto.address,
      createStoreDto.url,
    );
  }
}
