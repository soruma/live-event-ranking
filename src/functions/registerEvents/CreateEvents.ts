import {
  DynamoDBClient,
  createClient
} from "./modules/deps.ts";
import { localClientConfig } from "./modules/LocalClientConfig.ts";
import { Event } from "./modules/types.ts";

export class CreateEvents {
  events: Event[];
  private client: DynamoDBClient;

  constructor(events: Event[]) {
    this.events = events;

    if (Deno.env.get("USE_AWS")!) {
      this.client = createClient();
    } else {
      this.client = createClient(localClientConfig());
    }
  }

  save(): Promise<boolean> {
    const tableName: string = Deno.env.get("TABLE_NAME")!;
    const tableItems = this.events.map((event) => {
      return {
        PutRequest: {
          Item: {
            EventId: event.id,
            Attribute: "Details",

            CategoryId: event.categoryId,
            CategoryName: event.categoryName,
            BannerImageURL: event.bannerImageURL,
            Weight: event.weight,
            StartAt: event.startAt,
            EndAt: event.endAt
          }
        }
      }
    });
    let requestItems: { [key: string]: any } = {};
    requestItems[tableName] = tableItems;
    console.log(JSON.stringify({ RequestItems: requestItems }));

    return new Promise((resolve, reject) => {
      this.client.batchWriteItem({
        RequestItems: requestItems
      }).then(() => {
        resolve(true);
      }).catch((error) => {
        reject(error);
      });
    });
  }
}
