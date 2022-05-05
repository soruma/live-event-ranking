import { Context } from "https://deno.land/x/lambda@1.18.0/mod.ts";
import { sleep } from "https://deno.land/x/sleep/mod.ts";
import { ErrorResponse, Event } from "./modules/types.ts";
import { FetchEvents, OngoingEvents, ResponseEvent } from './FetchEvents.ts';
import { FetchEvent } from "./FetchEvent.ts";

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
    const events = await fetchEvents().then(
      (responseEvents: ResponseEvent[]) => {
        return Promise.resolve(responseEvents);
      }
    );
    const eventIds = events.map((event) => { return event.id! });

    const eventDetails = await Promise.all(
      eventIds.map(
        (eventId: number) => {
          const fetchEvent = new FetchEvent(eventId);
          return fetchEvent.fetch();
        },
      ),
    );

    return { statusCode: 200, events: eventDetails };;
  } catch(error) {
    return { statusCode: 500, message: error.message };
  }
}

function fetchEvents(): Promise<ResponseEvent[]> {
  const instance = new FetchEvents();

  return new Promise((resolve, reject) => {
    instance.ongoingEvents().then((ongoingEvents: OngoingEvents) => {
      if (ongoingEvents.status != 200) {
        reject({
          statusCode: ongoingEvents.status,
          message: `Failed to get events from LINE LIVE. response: ${JSON.stringify(ongoingEvents)}`,
        });
      }

      const events: ResponseEvent[] = [];
      Object.keys(ongoingEvents.eventByCategoryId).forEach(key => {
        const belongToEvents = ongoingEvents.eventByCategoryId[key];
        events.push(...belongToEvents);
      });

      resolve(events);
    }).catch((error) => {
      reject(error);
    });
  });
}