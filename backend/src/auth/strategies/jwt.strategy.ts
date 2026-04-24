/**
 * JWT Strategy — xác thực token từ header Authorization
 * Trích xuất userId và role từ JWT payload
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'brainlift-secret-key'),
    });
  }

  /**
   * Được gọi sau khi JWT đã verify thành công
   * Trả về user object → sẽ gắn vào request.user
   */
  async validate(payload: { sub: string; role: string }) {
    const user = await this.userService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    return { id: user.id, email: user.email, role: user.role };
  }
}
