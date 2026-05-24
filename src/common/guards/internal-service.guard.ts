import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class InternalServiceGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const key = request.headers['x-internal-service-key'];
    if (key !== this.config.get('INTERNAL_SERVICE_KEY')) {
      throw new UnauthorizedException('Invalid internal service key');
    }
    return true;
  }
}
