import { Context } from "https://deno.land/x/lambda@1.18.0/mod.ts";
import {
  DynamoDBClient,
  createClient,
  Doc
} from "./modules/deps.ts";
import { ErrorResponse, Event } from "./modules/types.ts";
import { FetchEvent } from "./modules/FetchEvent.ts";
import { localClientConfig } from "./modules/LocalClientConfig.ts";

type EventParam = null;
type SuccessResponse = {
  statusCode: number,
  events: Event[]
};

export async function handler(
  _event: EventParam,
  _context: Context
): Promise<SuccessResponse | ErrorResponse> {
  try {
    const eventIds = await eventRankingOfFinishedChannels().then((response) => {
      const items = (response as Doc).Items;
      const eventIds = items.map((event: Event) => {
        return event.eventId;
      });

      return eventIds;
    }).catch((error) => {
      throw Error(error);
    });

    const events: Event[] = await Promise.all(
      eventIds.map(
        async (eventId: number) => {
          console.log(`Fetching event for ${eventId}`);
          const fetchEvent = new FetchEvent(eventId);

          return await fetchEvent.fetch();
        },
      ),
    );

    return { statusCode: 200, events: events };
  } catch(error) {
    return { statusCode: 500, message: error.message };
  }
}

function eventRankingOfFinishedChannels() {
  const now = Date.now();
  const graceToExcludeEvents = parseInt(Deno.env.get("GRACE_TO_EXCLUDE_EVENTS")!);

  return client().scan({
    TableName: Deno.env.get("TABLE_NAME")!,
    AttributesToGet: ["eventId"],
    ScanFilter: {
      rankingType: {
        AttributeValueList: ["NONE"], ComparisonOperator: "EQ"
      },
      endAt: {
        AttributeValueList: [now + graceToExcludeEvents], ComparisonOperator: "LT"
      }
    }
  })
}

function client(): DynamoDBClient {
  if (Deno.env.get("USE_AWS")!) {
    return createClient();
  } else {
    return createClient(localClientConfig());
  }
}