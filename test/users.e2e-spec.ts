import { faker } from '@faker-js/faker';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import { SignUpDto } from '../src/auth/dtos/sign-up.dto';
import { FriendRequestsService } from '../src/friend-requests/friend-requests.service';
import { User } from '../src/users/entities/user.entity';
import {
  USERS_ENDPOINT,
  USERS_NAME_ENDPOINT,
  USERS_NAME_FRIENDS_ENDPOINT,
  USERS_NAME_FRIENDS_FRIENDNAME_ENDPOINT,
} from '../src/users/users.controller';
import { AppModule } from './../src/app.module';
import { clearDatabase, login } from './utils';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let authHeader: object;
  let authService: AuthService;
  let friendRequestsService: FriendRequestsService;
  let user: User;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    authService = app.get<AuthService>(AuthService);
    friendRequestsService = app.get<FriendRequestsService>(
      FriendRequestsService,
    );
    const loginData = await login(app);
    authHeader = loginData.authHeader;
    user = loginData.user;
  });

  afterEach(async () => {
    await clearDatabase(app);
    await app.close();
  });

  describe(USERS_ENDPOINT + ' (GET)', () => {
    it('should exist', () => {
      return request(app.getHttpServer())
        .get(USERS_ENDPOINT)
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      return request(app.getHttpServer())
        .get(USERS_ENDPOINT)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it(`should return ${HttpStatus.OK} with authorization`, async () => {
      return request(app.getHttpServer())
        .get(USERS_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK);
    });

    it(`should return ${HttpStatus.OK} and  array with length of one with authorization`, async () => {
      return request(app.getHttpServer())
        .get(USERS_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect((res.body as Array<any>).length).toBe(1);
        });
    });

    it(`should return ${HttpStatus.OK} and array with length of 10 with authorization`, async () => {
      // create 9 users since one is already created while login
      for (let i = 0; i < 9; i++) {
        const userData: SignUpDto = {
          username: faker.internet.userName(),
          password: faker.internet.password(),
        };
        await authService.signUp(userData.username, userData.password);
      }

      return request(app.getHttpServer())
        .get(USERS_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect((res.body as Array<any>).length).toBe(10);
        });
    });

    it(`should return ${HttpStatus.OK} and 10 valid user with authorization`, async () => {
      // create 9 users since one is already created while login
      for (let i = 0; i < 9; i++) {
        const userData: SignUpDto = {
          username: faker.internet.userName(),
          password: faker.internet.password(),
        };
        await authService.signUp(userData.username, userData.password);
      }

      return request(app.getHttpServer())
        .get(USERS_ENDPOINT)
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect((body as Array<any>).length).toBe(10);
          (body as Array<any>).forEach((item) => {
            expect(item.id).toBeDefined();
            expect(item.username).toBeDefined();
            expect(item.createdAt).toBeDefined();
            expect(item.updatedAt).toBeDefined();
          });
        });
    });

    it.each([0, 10, 25])(
      `should return ${HttpStatus.OK} and %p + 1 users with no passwordHash with authorization`,
      async (userAmount: number) => {
        for (let i = 0; i < userAmount; i++) {
          const userData: SignUpDto = {
            username: faker.internet.userName(),
            password: faker.internet.password(),
          };
          await authService.signUp(userData.username, userData.password);
        }

        return request(app.getHttpServer())
          .get(USERS_ENDPOINT)
          .set(authHeader)
          .expect(HttpStatus.OK)
          .expect(({ body }) => {
            // check for one more user since one user has been created in the signup process
            expect((body as Array<any>).length).toBe(userAmount + 1);
            (body as Array<any>).forEach((item) => {
              expect(item.passwordHash).toBeUndefined();
            });
          });
      },
    );
  });

  describe(USERS_NAME_ENDPOINT + ' (GET)', () => {
    it('should exist', () => {
      return request(app.getHttpServer())
        .get(USERS_NAME_ENDPOINT.replace(':name', faker.internet.userName()))
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      return request(app.getHttpServer())
        .get(USERS_NAME_ENDPOINT.replace(':name', faker.internet.userName()))
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it(`should return ${HttpStatus.OK} with authorization`, async () => {
      return request(app.getHttpServer())
        .get(USERS_NAME_ENDPOINT.replace(':name', user.username))
        .set(authHeader)
        .expect(HttpStatus.OK);
    });

    it(`should return ${HttpStatus.OK} and user with authorization`, async () => {
      return request(app.getHttpServer())
        .get(USERS_NAME_ENDPOINT.replace(':name', user.username))
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body.id).toEqual(user.id);
          expect(body.username).toEqual(user.username);
          expect(body.createdAt).toEqual(user.createdAt.toISOString());
          expect(body.updatedAt).toEqual(user.updatedAt.toISOString());
        });
    });

    it(`should return ${HttpStatus.OK} and no passwordHash with authorization`, async () => {
      return request(app.getHttpServer())
        .get(USERS_NAME_ENDPOINT.replace(':name', user.username))
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect(body.passwordHash).toBeUndefined();
        });
    });

    it(`should return ${HttpStatus.NOT_FOUND} with random username as parameter with authorization`, async () => {
      return request(app.getHttpServer())
        .get(USERS_NAME_ENDPOINT.replace(':name', faker.internet.userName()))
        .set(authHeader)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe(USERS_NAME_FRIENDS_ENDPOINT + ' (GET)', () => {
    it('should exist', () => {
      return request(app.getHttpServer())
        .get(USERS_NAME_FRIENDS_ENDPOINT)
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      return request(app.getHttpServer())
        .get(USERS_NAME_FRIENDS_ENDPOINT)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it(`should return ${HttpStatus.OK} with authorization`, async () => {
      return request(app.getHttpServer())
        .get(USERS_NAME_FRIENDS_ENDPOINT.replace(':name', user.username))
        .set(authHeader)
        .expect(HttpStatus.OK);
    });

    it(`should return ${HttpStatus.OK} and empty array with authorization`, async () => {
      return request(app.getHttpServer())
        .get(USERS_NAME_FRIENDS_ENDPOINT.replace(':name', user.username))
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect((body as Array<any>).length).toBe(0);
        });
    });

    it(`should return ${HttpStatus.OK} and array of 3 users with authorization`, async () => {
      for (let i = 0; i < 3; i++) {
        const userData: SignUpDto = {
          username: faker.internet.userName(),
          password: faker.internet.password(),
        };
        const createdUser: User = await authService.signUp(
          userData.username,
          userData.password,
        );
        const friendRequest = await friendRequestsService.sendFriendRequest(
          createdUser,
          user,
        );
        await friendRequestsService.acceptFriendRequest(friendRequest.id, user);
      }

      return request(app.getHttpServer())
        .get(USERS_NAME_FRIENDS_ENDPOINT.replace(':name', user.username))
        .set(authHeader)
        .expect(HttpStatus.OK)
        .expect(({ body }) => {
          expect((body as Array<any>).length).toBe(3);
          (body as Array<any>).forEach((item) => {
            expect(item.id).toBeDefined();
            expect(item.username).toBeDefined();
            expect(item.createdAt).toBeDefined();
            expect(item.updatedAt).toBeDefined();
          });
        });
    });

    it(`should return ${HttpStatus.NOT_FOUND} with random username as parameter with authorization`, async () => {
      return request(app.getHttpServer())
        .get(
          USERS_NAME_FRIENDS_ENDPOINT.replace(
            ':name',
            faker.internet.userName(),
          ),
        )
        .set(authHeader)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe(USERS_NAME_FRIENDS_FRIENDNAME_ENDPOINT + ' (DELETE)', () => {
    it('should exist', () => {
      return request(app.getHttpServer())
        .delete(
          USERS_NAME_FRIENDS_FRIENDNAME_ENDPOINT.replace(
            ':name',
            faker.internet.userName(),
          ).replace(':friendName', faker.internet.userName()),
        )
        .expect((response) => response.status !== HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} without authorization`, async () => {
      return request(app.getHttpServer())
        .delete(
          USERS_NAME_FRIENDS_FRIENDNAME_ENDPOINT.replace(
            ':name',
            faker.internet.userName(),
          ).replace(':friendName', faker.internet.userName()),
        )
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it(`should return ${HttpStatus.NOT_FOUND} when deleting user that does not exist`, async () => {
      return request(app.getHttpServer())
        .delete(
          USERS_NAME_FRIENDS_FRIENDNAME_ENDPOINT.replace(
            ':name',
            faker.internet.userName(),
          ).replace(':friendName', faker.internet.userName()),
        )
        .set(authHeader)
        .expect(HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.NOT_FOUND} when to be deleted user does not exist`, async () => {
      return request(app.getHttpServer())
        .delete(
          USERS_NAME_FRIENDS_FRIENDNAME_ENDPOINT.replace(
            ':name',
            user.username,
          ).replace(':friendName', faker.internet.userName()),
        )
        .set(authHeader)
        .expect(HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.NOT_FOUND} when to be deleted user exists but is not friends with user`, async () => {
      const toBeDeletedUser: User = await authService.signUp(
        faker.internet.userName(),
        faker.internet.password(),
      );

      return request(app.getHttpServer())
        .delete(
          USERS_NAME_FRIENDS_FRIENDNAME_ENDPOINT.replace(
            ':name',
            user.username,
          ).replace(':friendName', toBeDeletedUser.username),
        )
        .set(authHeader)
        .expect(HttpStatus.NOT_FOUND);
    });

    it(`should return ${HttpStatus.UNAUTHORIZED} when trying to delete another users friends`, async () => {
      const otherUser: User = await authService.signUp(
        faker.internet.userName(),
        faker.internet.password(),
      );

      return request(app.getHttpServer())
        .delete(
          USERS_NAME_FRIENDS_FRIENDNAME_ENDPOINT.replace(
            ':name',
            otherUser.username,
          ).replace(':friendName', faker.internet.userName()),
        )
        .set(authHeader)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it(`should return ${HttpStatus.OK} when deleting a present friendship`, async () => {
      const createdUser: User = await authService.signUp(
        faker.internet.userName(),
        faker.internet.password(),
      );
      const friendRequest = await friendRequestsService.sendFriendRequest(
        createdUser,
        user,
      );
      await friendRequestsService.acceptFriendRequest(friendRequest.id, user);

      return request(app.getHttpServer())
        .delete(
          USERS_NAME_FRIENDS_FRIENDNAME_ENDPOINT.replace(
            ':name',
            user.username,
          ).replace(':friendName', createdUser.username),
        )
        .set(authHeader)
        .expect(HttpStatus.OK);
    });
  });
});