import {
  DynamoDBClient,
  createClient
} from "./lib/deps.ts";
import { localClientConfig } from "./lib/LocalClientConfig.ts";
import { Event } from "./modules/types.ts";

export class CreateEvent {
  event: Event;
  private client: DynamoDBClient;

  constructor(event: Event) {
    this.event = event;

    if (Deno.env.get("USE_AWS")!) {
      this.client = createClient();
    } else {
      this.client = createClient(localClientConfig());
    }
  }

  save(): Promise<boolean> {
    return new Promise((resolve) => {
      this.client.putItem({
        TableName: Deno.env.get("TABLE_NAME")!,
        Item: {
          EventId: this.event.id,
          Attribute: "Details",

          CategoryId: this.event.categoryId,
          CategoryName: this.event.categoryName,
          BannerImageURL: this.event.bannerImageURL,
          Weight: this.event.weight,
          StartAt: this.event.startAt,
          EndAt: this.event.endAt
        }
      });

      resolve(true);
    });
  }
}
