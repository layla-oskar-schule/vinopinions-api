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
import { CreateWineMakerDto } from './dtos/create-winemaker.dto';
import { Winemaker } from './entities/winemaker.entity';
import { WinemakersService } from './winemakers.service';

@Controller('winemakers')
@ApiTags('winemakers')
@ApiUnauthorizedResponse({
  description: 'Not logged in',
})
export class WinemakersController {
  constructor(private winemakersService: WinemakersService) {}

  @ApiOperation({ summary: 'get winemaker by id' })
  @HttpCode(HttpStatus.OK)
  @Get(':id')
  @ApiOkResponse({
    description: 'Winemaker has been found',
    type: Winemaker,
  })
  @ApiNotFoundResponse({
    description: 'Winemaker has not been found',
  })
  findById(@Param('id') id: string): Promise<Winemaker> {
    return this.winemakersService.findOne({ where: { id } });
  }

<<<<<<< HEAD
  @ApiOkResponse({
    description: 'Winemakers have been found',
    type: Winemaker,
    isArray: true,
  })
=======
  @ApiOperation({ summary: 'get all winemakers' })
>>>>>>> developer
  @HttpCode(HttpStatus.OK)
  @Get()
  findAll(): Promise<Winemaker[]> {
    return this.winemakersService.findMany();
  }

  @ApiOperation({ summary: 'create a winemaker' })
  @HttpCode(HttpStatus.CREATED)
  @Post()
  @ApiCreatedResponse({
    description: 'Winemaker has been created',
    type: Winemaker,
  })
  @ApiBadRequestResponse({
    description: 'Invalid data',
  })
  create(@Body() createWinemakersDto: CreateWineMakerDto) {
    return this.winemakersService.create(createWinemakersDto.name);
  }
}
