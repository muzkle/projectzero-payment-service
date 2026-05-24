import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class PartnerContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = request.headers['x-user-id'];
    const partnerId = request.headers['x-partner-id'];

    if (!userId) {
      throw new UnauthorizedException('Missing x-user-id header');
    }
    if (!partnerId) {
      throw new BadRequestException('Missing x-partner-id header');
    }
    return true;
  }
}
