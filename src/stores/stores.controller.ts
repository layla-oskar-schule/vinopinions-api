import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
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

const STORES_ENDPOINT_NAME = 'stores';
export const STORES_ENDPOINT = `/${STORES_ENDPOINT_NAME}`;
const STORES_ID_ENDPOINT_NAME = ':id';
export const STORES_ID_ENDPOINT = `/${STORES_ENDPOINT_NAME}/${STORES_ID_ENDPOINT_NAME}`;
@Controller(STORES_ENDPOINT_NAME)
@ApiTags(STORES_ENDPOINT_NAME)
@ApiUnauthorizedResponse({
  description: 'Not logged in',
})
@ApiBearerAuth()
export class StoresController {
  constructor(private storesService: StoresService) {}

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

  @ApiOperation({ summary: 'get store by id' })
  @HttpCode(HttpStatus.OK)
  @Get(STORES_ID_ENDPOINT_NAME)
  @ApiOkResponse({
    description: 'Store has been found',
    type: Store,
  })
  @ApiNotFoundResponse({
    description: 'Store has not been found',
  })
  findById(@Param('id', new ParseUUIDPipe()) id: string): Promise<Store> {
    return this.storesService.findOne({ where: { id } });
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
