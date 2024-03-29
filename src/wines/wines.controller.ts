import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ILike } from 'typeorm';
import { AuthenticatedRequest } from '../auth/auth.guard';
import { FileUploadDto } from '../common/dtos/FileUploadDto';
import {
  ID_URL_PARAMETER,
  ID_URL_PARAMETER_NAME,
} from '../constants/url-parameter';
import { ApiPaginationResponse } from '../pagination/ApiPaginationResponse';
import { FilterPaginationOptionsDto } from '../pagination/filter-pagination-options.dto';
import { PaginationOptionsDto } from '../pagination/pagination-options.dto';
import { CreateRatingDto } from '../ratings/dtos/create-rating.dto';
import { FILE_MAX_SIZE } from '../s3/constants';
import { Store } from '../stores/entities/store.entity';
import { PageDto } from './../pagination/page.dto';
import { Rating } from './../ratings/entities/rating.entity';
import { CreateWineDto } from './dtos/create-wine.dto';
import { UpdateWineDto } from './dtos/update-wine.dto';
import { Wine } from './entities/wine.entity';
import { WinesService } from './wines.service';

const WINES_ENDPOINT_NAME = 'wines';
export const WINES_ENDPOINT = `/${WINES_ENDPOINT_NAME}`;
const WINES_ID_URL_PARAMETER = ID_URL_PARAMETER;
export const WINES_ID_ENDPOINT = `${WINES_ENDPOINT}/${WINES_ID_URL_PARAMETER}`;
const WINES_ID_RATINGS_ENDPOINT_NAME = `${WINES_ID_URL_PARAMETER}/ratings`;
export const WINES_ID_RATINGS_ENDPOINT = `${WINES_ENDPOINT}/${WINES_ID_RATINGS_ENDPOINT_NAME}`;
const WINES_ID_STORES_ENDPOINT_NAME = `${WINES_ID_URL_PARAMETER}/stores`;
export const WINES_ID_STORES_ENDPOINT = `${WINES_ENDPOINT}/${WINES_ID_STORES_ENDPOINT_NAME}`;
const WINES_ID_IMAGE_ENDPOINT_NAME = `${WINES_ID_URL_PARAMETER}/image`;
export const WINES_ID_IMAGE_ENDPOINT = `${WINES_ENDPOINT}/${WINES_ID_IMAGE_ENDPOINT_NAME}`;

@Controller(WINES_ENDPOINT_NAME)
@ApiTags(WINES_ENDPOINT_NAME)
@ApiUnauthorizedResponse({
  description: 'Not logged in',
})
@ApiBearerAuth()
export class WinesController {
  storesService: any;
  constructor(private winesService: WinesService) {}

  @ApiOperation({ summary: 'get wine by id' })
  @Get(WINES_ID_URL_PARAMETER)
  @ApiOkResponse({
    description: 'Wine has been found',
    type: Wine,
  })
  @ApiNotFoundResponse({
    description: 'Wine has not been found',
  })
  findById(@Param(ID_URL_PARAMETER_NAME, new ParseUUIDPipe()) id: string) {
    return this.winesService.findOne({
      where: { id },
    });
  }

  @ApiOperation({ summary: 'get all wines' })
  @Get()
  @ApiPaginationResponse(Wine, {
    description: 'Wines have been found',
    status: HttpStatus.OK,
  })
  findAll(
    @Query() filterPaginationOptionsDto: FilterPaginationOptionsDto,
  ): Promise<PageDto<Wine>> {
    return this.winesService.findManyPaginated(filterPaginationOptionsDto, {
      where: {
        name: ILike(`%${filterPaginationOptionsDto.filter}%`),
      },
    });
  }

  @ApiOperation({ summary: 'get stores of wine' })
  @Get(WINES_ID_STORES_ENDPOINT_NAME)
  @ApiPaginationResponse(Store, {
    description: 'Stores of the wine',
    status: HttpStatus.OK,
  })
  @ApiNotFoundResponse({
    description: 'Wine could not be found',
  })
  async findAllStores(
    @Param(ID_URL_PARAMETER_NAME, new ParseUUIDPipe()) id: string,
    @Query() filterPaginationOptionsDto: FilterPaginationOptionsDto,
  ): Promise<PageDto<Store>> {
    const wine: Wine = await this.winesService.findOne({
      where: {
        id,
      },
    });
    return await this.winesService.findStoresPaginated(
      wine,
      filterPaginationOptionsDto,
      {
        where: {
          name: ILike(`%${filterPaginationOptionsDto.filter}%`),
        },
      },
    );
  }

  @ApiOperation({ summary: 'get ratings of wine' })
  @Get(WINES_ID_RATINGS_ENDPOINT_NAME)
  @ApiPaginationResponse(Rating, {
    description: 'Ratings of the wine',
    status: HttpStatus.OK,
  })
  @ApiNotFoundResponse({
    description: 'Wine could not be found',
  })
  async findAllRatings(
    @Param(ID_URL_PARAMETER_NAME, new ParseUUIDPipe()) id: string,
    @Query() paginationOptionsDto: PaginationOptionsDto,
  ): Promise<PageDto<Rating>> {
    const wine: Wine = await this.winesService.findOne({
      where: {
        id,
      },
    });
    return await this.winesService.findRatingsPaginated(
      wine,
      paginationOptionsDto,
    );
  }

  @ApiOperation({ summary: 'create a wine' })
  @Post()
  @ApiCreatedResponse({
    description: 'Wine has been created',
    type: Wine,
  })
  @ApiBadRequestResponse({
    description: 'Invalid data',
  })
  create(@Body() createWineDto: CreateWineDto): Promise<Wine> {
    return this.winesService.create(
      createWineDto.name,
      createWineDto.year,
      createWineDto.winemakerId,
      createWineDto.storeIds,
      createWineDto.grapeVariety,
      createWineDto.heritage,
    );
  }

  @ApiOperation({ summary: 'update a wine' })
  @HttpCode(HttpStatus.OK)
  @Put(WINES_ID_URL_PARAMETER)
  @ApiCreatedResponse({
    description: 'Store has been added to the wine',
    type: Wine,
  })
  @ApiBadRequestResponse({
    description: 'Invalid data',
  })
  @ApiNotFoundResponse({
    description: 'Wine or store has not been found',
  })
  async update(
    @Param(ID_URL_PARAMETER_NAME, new ParseUUIDPipe()) id: string,
    @Body() updateWineDto: UpdateWineDto,
  ) {
    const wine = await this.winesService.findOne({
      where: { id },
    });
    return this.winesService.update(wine, updateWineDto.storeIds);
  }

  @ApiOperation({ summary: 'rate a wine' })
  @Post(WINES_ID_RATINGS_ENDPOINT_NAME)
  @ApiCreatedResponse({
    description: 'Ratings has been added to the wine',
    type: Rating,
  })
  @ApiBadRequestResponse({
    description: 'Invalid data',
  })
  @ApiNotFoundResponse({
    description: 'Wine has not been found',
  })
  async createRating(
    @Param(ID_URL_PARAMETER_NAME, new ParseUUIDPipe()) wineId: string,
    @Body() { stars, text }: CreateRatingDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<Rating> {
    const wine: Wine = await this.winesService.findOne({
      where: { id: wineId },
    });
    return this.winesService.createRating(stars, text, request.user, wine);
  }

  @ApiOperation({ summary: 'update image' })
  @Put(WINES_ID_IMAGE_ENDPOINT_NAME)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Image of the store',
    type: FileUploadDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  async updateImage(
    @Param(ID_URL_PARAMETER_NAME, new ParseUUIDPipe()) id: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: 'jpeg',
        })
        .addMaxSizeValidator({
          maxSize: FILE_MAX_SIZE,
        })
        .build(),
    )
    file: Express.Multer.File,
  ) {
    const store: Store = await this.storesService.findOne({ where: { id } });
    await this.storesService.updateImage(store, file.buffer);
  }
}
