import { Context, slices } from "./deps.ts"
import { Event } from "./modules/types.ts";
import { CreateEvents } from './CreateEvents.ts';
import { ErrorResponse } from './modules/types.ts';

type EventParams = {
  events: Event[]
}
type SuccessResponse = {
  statusCode: number
}

export async function handler(
  event: EventParams,
  _context: Context
): Promise<SuccessResponse> {
  console.log(`event: ${JSON.stringify(event)}`);

  const promises: Promise<SuccessResponse | ErrorResponse>[] = [];
  for (const events of slices(event.events, 25)) {
    promises.push(
      new Promise(
        (resolve, reject) => {
          const createEvent = new CreateEvents(events as Event[]);

          createEvent
            .save()
            .then(() => {
              resolve({ statusCode: 200 });
            })
            .catch(
              (error: Error) => {
                reject({ statusCode: 500, message: error });
              },
            );
        },
      ),
    );
  }

  await Promise.all(promises).then((responses) => {
    responses.forEach(
      (response: SuccessResponse | ErrorResponse) => {
        if (response.statusCode == 500) {
          new Error((response as ErrorResponse).message);
        }
      }
    );
  }).catch((error) => {
    return { statusCode: 500, message: error };
  });

  return { statusCode: 200 };
}
