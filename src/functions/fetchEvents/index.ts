import { Context } from "https://deno.land/x/lambda@1.18.0/mod.ts";
import { ErrorResponse, Event } from "./modules/types.ts";
import { FetchEvents } from './FetchEvents.ts';
import { ResponseEvent } from './types.ts';

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
          event.eventId = event.id!;
          event.categoryId = parseInt(key);
          event = removeUnnecessaryAttributes(event);
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

function removeUnnecessaryAttributes(event: ResponseEvent): Event {
  delete event.id;
  delete event.weight;
  delete event.rankingStartAt;
  delete event.rankingEndAt;

  return event as Event;
}