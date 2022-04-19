import {
  DynamoDBClient,
  createClient,
  Doc
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
    return new Promise(
					(resolve, reject) => {
						this.client
							.putItem({
								TableName: Deno.env.get("TABLE_NAME")!,
								Item: {
									EventId: this.evnetId,
									Attribute: `Timestamp-${this.timestamp}#ChannelId-#${this.eventRanking.channelId}`,

									Rank: this.eventRanking.rank,
									Point: this.eventRanking.point,
									Timestamp: this.timestamp,
									ChannelId: this.eventRanking.channelId,
									ChannelIconURL: this.eventRanking.channelIconURL,
									ChannelName: this.eventRanking.channelName,
									FollowerCount: this.eventRanking.followerCount,
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