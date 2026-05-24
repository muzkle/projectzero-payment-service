import { Global, Module } from '@nestjs/common';
import { CatalogClient } from './catalog.client';
import { IdentityClient } from './identity.client';

@Global()
@Module({
  providers: [CatalogClient, IdentityClient],
  exports: [CatalogClient, IdentityClient],
})
export class ClientsModule {}
