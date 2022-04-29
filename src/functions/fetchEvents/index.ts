import { Context } from "https://deno.land/x/lambda@1.18.0/mod.ts";
import { Event } from "./modules/types.ts";
import { ErrorResponse } from "./types.ts";
import { FetchEvents } from './FetchEvents.ts';

type EventParam = null;
type SuccessResponse = {
  statusCode: number,
  events: Event[]
};

export function handler(
  _event: EventParam,
  _context: Context
): Promise<SuccessResponse | ErrorResponse> {
  const fetchEvents = new FetchEvents();

  return new Promise((resolve, reject) => {
    fetchEvents.ongoingEvents().then((ongoingEvents) => {
      if (ongoingEvents.status != 200) {
        resolve({
          statusCode: ongoingEvents.status,
          message: `Failed to get events from LINE LIVE. response: ${JSON.stringify(ongoingEvents)}`,
        });
      }
      const events: Event[] = [];

      Object.keys(ongoingEvents.eventByCategoryId).forEach(key => {
        const belongToEvents = ongoingEvents.eventByCategoryId[key];
        const appendCateEvents = belongToEvents.map(event => {
          event.categoryId = parseInt(key);
          return event;
        });
        events.push(...appendCateEvents);
      });

      resolve({ statusCode: 200, events: events });
    }).catch((error: Error) => {
      reject({ statusCode: 500, message: error.message });
    });
  });
}
