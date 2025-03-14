import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import User from '../interfaces/user.interface';

export const GetUser = createParamDecorator(
  (data: string[], ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    const user = request.user;

    if (!user) {
      throw new InternalServerErrorException('User not found (request)');
    }

    let userDataToReturn = user as User;

    if (data && data.length > 0) {
      userDataToReturn = {} as User;

      data.forEach((value) => {
        if (user.hasOwnProperty(value)) {
          userDataToReturn = {
            ...userDataToReturn,
            [value]: user[value],
          };
        }
      });
    }

    return userDataToReturn;
  },
);
