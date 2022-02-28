import {
  DynamoDBClient,
  createClient,
  ClientConfig
} from "./deps.ts";

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
      this.client = createClient(this.localClientConfig());
    }
  }

  async save(): Promise<boolean> {
    await this.client.putItem({
      TableName: "live-event-ranking-EventRankingHistories",
      Item: {
        PK: `Event#${this.evnetId}-Rank#${this.eventRanking.rank}-Timestamp#${this.timestamp}`,
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

  localClientConfig(): ClientConfig {
    return {
      region: "local",
      credentials: {
        accessKeyId: "dummy",
        secretAccessKey: "dummy"
      }
    };
  }
}
