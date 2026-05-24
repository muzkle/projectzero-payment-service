import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, isAxiosError } from 'axios';
import { PartnerDto, ApiResponse, ErrorCode } from '@projectzero/contracts';

@Injectable()
export class IdentityClient {
  private client: AxiosInstance;

  constructor(private config: ConfigService) {
    this.client = axios.create({
      baseURL: this.config.get<string>('IDENTITY_SERVICE_URL'),
      timeout: 10000,
    });
  }

  async getPartner(partnerId: string): Promise<PartnerDto> {
    try {
      const response = await this.client.get<ApiResponse<PartnerDto>>(
        `/v1/partners/${partnerId}`,
        { headers: this.internalHeaders() },
      );
      return response.data.data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'Partner not found' });
      }
      throw error;
    }
  }

  async updateStripeConnectAccount(partnerId: string, stripeConnectAccountId: string): Promise<void> {
    await this.client.patch(
      `/v1/partners/${partnerId}/stripe-connect`,
      { stripeConnectAccountId },
      { headers: this.internalHeaders(), validateStatus: () => true },
    );
  }

  private internalHeaders() {
    return {
      'x-internal-service-key': this.config.get<string>('INTERNAL_SERVICE_KEY'),
    };
  }
}
