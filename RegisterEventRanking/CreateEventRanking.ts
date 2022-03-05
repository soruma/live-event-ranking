import {
  DynamoDBClient,
  createClient
} from "./lib/deps.ts";
import { localClientConfig } from "./lib/LocalClientConfig.ts";

export class CreateEventRanking {
  timestamp: string;
  evnetId: number;
  eventRanking: any;
  client: DynamoDBClient;

  constructor(timestamp: string, evnetId: number, eventRanking: any) {
    this.timestamp = timestamp;
    this.evnetId = evnetId
    this.eventRanking = eventRanking;

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
        PK: `Timestamp#${this.timestamp}-Event#${this.evnetId}-Rank#${this.eventRanking.rank}`,
        EventId: this.evnetId,
        ChannelId: this.eventRanking.channelId,
        ChannelIconURL: this.eventRanking.channelIconURL,
        ChannelName: this.eventRanking.channelName,
        Point: this.eventRanking.point,
        FollowerCount: this.eventRanking.followerCount,
        timestamp: this.timestamp
      }
    });

    return true;
  }
}
