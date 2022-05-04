import {
  DynamoDBClient,
  createClient
} from "./modules/deps.ts";
import { localClientConfig } from "./modules/LocalClientConfig.ts";

export type UpdateEventDetailProps = {
  eventId: number,
  title: string,
  rankingType: string
};

export class UpdateEventDetail {
  updateEventDetail: UpdateEventDetailProps;
  private client: DynamoDBClient;

  constructor(updateEventDetail: UpdateEventDetailProps) {
    this.updateEventDetail = updateEventDetail;

    if (Deno.env.get("USE_AWS")!) {
      this.client = createClient();
    } else {
      this.client = createClient(localClientConfig());
    }
  }

  save(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.client.updateItem({
        TableName: Deno.env.get("TABLE_NAME")!,
        Key: { eventId: this.updateEventDetail.eventId, attribute: "Details" },
        UpdateExpression: "set #title = :title, #rankingType = :rankingType",
        ExpressionAttributeNames: { "#title": "title", "#rankingType": "rankingType" },
        ExpressionAttributeValues: {
          ":title": this.updateEventDetail.title,
          ":rankingType": this.updateEventDetail.rankingType,
        },
        ReturnValues: "UPDATED_NEW",
      }).then((returnValue) => {
        if (returnValue["Attributes"] && (returnValue["Attributes"]["title"] == undefined || returnValue["Attributes"]["rankingType"] == undefined)) {
          reject(false);
        } else {
          resolve(true);
        }
      });
    });
  }
}
