import { createClient, Doc, DynamoDBClient } from "./modules/deps.ts";
import { localClientConfig } from "./modules/LocalClientConfig.ts";

export type EventRanking = {
  rank: number,
  channelId: number,
  channelIconURL: string,
  channelName: string,
  point: number,
  followerCount: number,
}

export class CreateEventRanking {
  timestamp: string;
  evnetId: number;
  eventRanking: EventRanking;
  client: DynamoDBClient;

  constructor(timestamp: string, evnetId: number, eventRanking: EventRanking) {
    this.timestamp = timestamp;
    this.evnetId = evnetId;
    this.eventRanking = eventRanking;

    if (Deno.env.get("USE_AWS")!) {
      this.client = createClient();
    } else {
      this.client = createClient(localClientConfig());
    }
  }

  save(): Promise<boolean> {
    return new Promise(
      (resolve, reject) => {
        this.client
          .putItem({
            TableName: Deno.env.get("TABLE_NAME")!,
            Item: {
              eventId: this.evnetId,
              SK: `EventId-${this.evnetId}#Timestamp-${this.timestamp}#ChannelId-#${this.eventRanking.channelId}`,
              timestamp: this.timestamp,

              ...this.eventRanking,
            },
          })
          .then(
            (_value: Doc) => {
              resolve(true);
            },
          )
          .catch(
            (reason: any) => {
              console.log(reason);
              reject(false);
            },
          );
      },
    );
  }
}
