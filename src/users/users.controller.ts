import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Rating } from '../ratings/entities/rating.entity';
import { AuthenticatedRequest } from './../auth/auth.guard';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

const USERS_ENDPOINT_NAME = 'users';
export const USERS_ENDPOINT = `/${USERS_ENDPOINT_NAME}`;
const USERS_NAME_ENDPOINT_NAME = ':name';
export const USERS_NAME_ENDPOINT = `${USERS_ENDPOINT}/${USERS_NAME_ENDPOINT_NAME}`;
const USERS_NAME_FRIENDS_ENDPOINT_NAME = `${USERS_NAME_ENDPOINT_NAME}/friends`;
export const USERS_NAME_FRIENDS_ENDPOINT = `${USERS_ENDPOINT}/${USERS_NAME_FRIENDS_ENDPOINT_NAME}`;
const USERS_NAME_FRIENDS_FRIENDNAME_ENDPOINT_NAME = `${USERS_NAME_FRIENDS_ENDPOINT_NAME}/:friendName`;
export const USERS_NAME_FRIENDS_FRIENDNAME_ENDPOINT = `${USERS_ENDPOINT}/${USERS_NAME_FRIENDS_FRIENDNAME_ENDPOINT_NAME}`;

@Controller(USERS_ENDPOINT_NAME)
@ApiTags(USERS_ENDPOINT_NAME)
@ApiUnauthorizedResponse({
  description: 'Not logged in',
})
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiOperation({ summary: 'get all user' })
  @HttpCode(HttpStatus.OK)
  @Get()
  @ApiOkResponse({
    description: 'Users have been found',
    type: User,
    isArray: true,
  })
  findAll(): Promise<User[]> {
    return this.usersService.findMany();
  }

  @ApiOperation({ summary: 'get information about a user' })
  @HttpCode(HttpStatus.OK)
  @Get(USERS_NAME_ENDPOINT_NAME)
  @ApiOkResponse({
    description: 'User has been found',
    type: User,
  })
  @ApiNotFoundResponse({
    description: 'User has not been found',
  })
  findByName(@Param('name') username: string): Promise<User> {
    return this.usersService.findOne({
      where: {
        username,
      },
    });
  }

  @ApiOperation({ summary: 'get friends of a user' })
  @HttpCode(HttpStatus.OK)
  @Get(USERS_NAME_FRIENDS_ENDPOINT_NAME)
  @ApiOkResponse({
    description: 'Friends for the user have been found',
    type: User,
    isArray: true,
  })
  @ApiNotFoundResponse({
    description: 'User has not been found',
  })
  async getFriends(@Param('name') username: string): Promise<User[]> {
    const user: User = await this.usersService.findOne({
      where: {
        username,
      },
    });
    return this.usersService.getFriends(user);
  }

  @ApiOperation({ summary: 'remove a friend' })
  @HttpCode(HttpStatus.OK)
  @Delete(USERS_NAME_FRIENDS_FRIENDNAME_ENDPOINT_NAME)
  @ApiOkResponse({
    description: 'Friend has been deleted',
  })
  @ApiUnauthorizedResponse({
    description: 'You can not delete another users friendship',
  })
  @ApiNotFoundResponse({
    description: 'User has not been found or is not a friend',
  })
  async removeFriend(
    @Param('name') username: string,
    @Param('friendName') friendUsername: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    const removingUser: User = await this.usersService.findOne({
      where: {
        username,
      },
    });

    if (removingUser.id !== request.user.id)
      throw new UnauthorizedException(
        'You can not delete another users friend',
      );

    const toBeRemovedUser: User = await this.usersService.findOne({
      where: {
        username: friendUsername,
      },
    });

    return await this.usersService.removeFriend(removingUser, toBeRemovedUser);
  }

  @Get(':name/ratings')
  @ApiOkResponse({
    description: 'Ratings have been found',
    type: Rating,
    isArray: true,
  })
  @ApiOperation({ summary: 'get ratings by a user' })
  getRatings(@Param('name') username: string): Promise<Rating[]> {
    return this.usersService.getRatings(username);
  }
}
