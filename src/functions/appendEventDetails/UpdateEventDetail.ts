import {
  DynamoDBClient,
  createClient
} from "./modules/deps.ts";
import { localClientConfig } from "./modules/LocalClientConfig.ts";

export type UpdateEventDetailProps = {
  eventId: number,
  title: string
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
        Key: { EventId: this.updateEventDetail.eventId, Attribute: "Details" },
        UpdateExpression: "set #Title=:title",
        ExpressionAttributeNames: { "#Title": "Title" },
        ExpressionAttributeValues: { ":title": this.updateEventDetail.title },
        ReturnValues: "UPDATED_NEW",
      }).then((returnValue) => {
        if (returnValue["Attributes"] && returnValue["Attributes"]["Title"] == undefined) {
          reject(false);
        } else {
          resolve(true);
        }
      });
    });
  }
}
