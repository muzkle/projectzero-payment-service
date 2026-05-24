import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, isAxiosError } from 'axios';
import { StickerDto, ApiResponse, ErrorCode } from '@muzkle/contracts';

@Injectable()
export class CatalogClient {
  private client: AxiosInstance;

  constructor(private config: ConfigService) {
    this.client = axios.create({
      baseURL: this.config.get<string>('CATALOG_SERVICE_URL'),
      timeout: 10000,
    });
  }

  async getSticker(stickerId: string): Promise<StickerDto> {
    try {
      const response = await this.client.get<ApiResponse<StickerDto>>(
        `/v1/stickers/${stickerId}`,
        { headers: this.internalHeaders() },
      );
      return response.data.data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'Sticker not found' });
      }
      throw error;
    }
  }

  private internalHeaders() {
    return {
      'x-internal-service-key': this.config.get<string>('INTERNAL_SERVICE_KEY'),
    };
  }
}
