import { Context } from "https://deno.land/x/lambda@1.18.0/mod.ts";
import { ErrorResponse } from "./modules/types.ts";
import {
  DynamoDBClient,
  createClient,
  Doc
} from "./modules/deps.ts";
import { Event } from "./modules/types.ts"
import { localClientConfig } from "./modules/LocalClientConfig.ts";

type EventParam = null;
type SuccessResponse = {
  statusCode: number,
  eventIds: number[]
};

/**
 * Returns the event Id for which the ranking should be updated
 * 
 * Required Environment variables:
 * * `TABLE_NAME`: DynamoDB Table Name
 * * `GRACE_TO_EXCLUDE_EVENTS`: Grace time(s) to continue reacquiring rankings after the event ended
 * @param _event 
 * @param _context 
 */
export function handler(
  _event: EventParam,
  _context: Context
): Promise<SuccessResponse | ErrorResponse> {
  const now = Date.now();
  const graceToExcludeEvents = parseInt(Deno.env.get("GRACE_TO_EXCLUDE_EVENTS")!);

  const client = (() => {
			if (Deno.env.get("USE_AWS")!) {
				return createClient();
			} else {
				return createClient(localClientConfig());
			}
		})();

  return new Promise((resolve, reject) => {
    client.scan({
      TableName: Deno.env.get("TABLE_NAME")!,
      ScanFilter: {
        attribute: {
          AttributeValueList: ["Details"], ComparisonOperator: "EQ"
        },
        rankingType: {
          AttributeValueList: ["NONE"], ComparisonOperator: "NE"
        },
        endAt: {
          AttributeValueList: [now + graceToExcludeEvents], ComparisonOperator: "LT"
        }
      }
    }).then((response) => {
      const items = (response as Doc).Items;
      const eventIds = items.map((event: Event) => {
        return event.eventId.toString();
      });
      resolve({ statusCode: 200, eventIds: eventIds });
    }).catch((error) => {
      reject({ statusCode: 500, message: error });
    });
  });
}
