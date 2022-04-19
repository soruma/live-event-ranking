import {
  DynamoDBClient,
  createClient
} from "./lib/deps.ts";
import { localClientConfig } from "./lib/LocalClientConfig.ts";
import { LiveEvent } from "./types.ts";

export class CreateEvent {
  event: LiveEvent;
  private client: DynamoDBClient;

  constructor(event: LiveEvent) {
    this.event = event;

    if (Deno.env.get("USE_AWS")!) {
      this.client = createClient();
    } else {
      this.client = createClient(localClientConfig());
    }
  }

  async save(): Promise<boolean> {
    await this.client.putItem({
      TableName: Deno.env.get("TABLE_NAME")!,
      Item: {
        EventId: this.event.id,
        Attribute: "Details",
        
        Title: this.event.title,
        BannerImageURL: this.event.bannerImageURL,
        Weight: this.event.weight,
        StartAt: this.event.startAt,
        EndAt: this.event.endAt,
        ParticipantCount: this.event.participantCount,
      }
    });

    return true;
  }
}