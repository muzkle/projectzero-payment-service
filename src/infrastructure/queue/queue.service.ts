import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  QUEUE_NAMES,
  JOB_NAMES,
  PurchaseCompletedEvent,
} from '@projectzero/contracts';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue(QUEUE_NAMES.COLLECTION) private collectionQueue: Queue,
  ) {}

  async publishPurchaseCompleted(event: PurchaseCompletedEvent): Promise<void> {
    await this.collectionQueue.add(JOB_NAMES.PURCHASE_COMPLETED, event, {
      jobId: event.eventId,
      removeOnComplete: true,
      attempts: 5,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }
}
