import { Context } from "https://deno.land/x/lambda@1.18.0/mod.ts";
import {
  DynamoDBClient,
  createClient,
  Doc
} from "./modules/deps.ts";
import { ErrorResponse, Event } from "./modules/types.ts";
import { FetchEvent } from "./modules/FetchEvent.ts";
import { localClientConfig } from "./modules/LocalClientConfig.ts";
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.22-alpha/deno-dom-wasm.ts';
import { sleep } from "https://deno.land/x/sleep/mod.ts";

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
    const blockEventIds = await eventRankingOfFinishedChannels().then((response) => {
      const items = (response as Doc).Items;
      const eventIds = items.map((event: Event) => {
        return event.eventId;
      });

      return eventIds;
    }).catch((error) => {
      throw Error(error);
    });

    const blockEvents: FetchEvent[] = await Promise.all(
      blockEventIds.map(
        async (eventId: number) => {
          console.log(`Fetching block event for ${eventId}`);
          const fetchEvent = new FetchEvent(eventId);

          return await fetchEvent.fetch();
        },
      ),
    );

    const eventIds = blockEvents.map((blockEvent) => { return eventInsideBlock(blockEvent) }).flat();
    const events: Event[] = [];
    await Promise.all(eventIds.map((eventId) => {
      sleep(1);
      console.log(`Fetching event for ${eventId}`);
      const fetchEvent = new FetchEvent(eventId);
      return fetchEvent.fetch();
    })).then((fetchEvents) => {
      fetchEvents.forEach((fetchEvent) => {
        events.push(fetchEvent.event());
      });
    });

    return { statusCode: 200, events: events };
  } catch(error) {
    return { statusCode: 500, message: error.message };
  }
}

function eventInsideBlock(fetchEvent: FetchEvent): number[] {
  const contentsDoc = new DOMParser().parseFromString(fetchEvent.dataEvent.contentsText, "text/html");
  const eventButtons = contentsDoc!.querySelectorAll(".box-body > a.btn")
  const blockEventIds: number[] = [];

  const re = /event\/(\d{5,})/;
  // href = https://live.line.me/event/12590
  eventButtons.forEach((btn: any) => { blockEventIds.push(parseInt(btn.attributes.href.match(re)[1])); });

  return blockEventIds;
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