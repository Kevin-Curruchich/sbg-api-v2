import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import { CreateUserDto } from './dto/create-user.dto';
import { AuthRepository } from './auth.repository';
import { JwtPayload, ValidRoles } from './interfaces';
import { LoginUserDTO } from './dto/login-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  createUser(createUserDTO: CreateUserDto) {
    const { password, ...userData } = createUserDTO;

    const data = {
      ...userData,
      password: bcrypt.hashSync(password, 10),
      role_id: ValidRoles.admin,
    };

    return this.authRepository.createAdminUser(data);
  }

  async login(loginUserDTO: LoginUserDTO) {
    const { email, password } = loginUserDTO;

    const user = await this.authRepository.findUserByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      userId: user.user_id,
      roleId: user.role_id,
    };

    const token = this.getJwtToken(payload);

    return {
      userId: user.user_id,
      email: user.email,
      username: user.username,
      role: user.role_id,
      token,
    };
  }

  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }
}
