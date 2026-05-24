import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentPartnerId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['x-partner-id'] as string;
  },
);
