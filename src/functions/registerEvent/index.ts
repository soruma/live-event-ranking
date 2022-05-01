import { Context } from "./lib/deps.ts"
import { Event } from "./modules/types.ts";
import { CreateEvent } from './CreateEvent.ts';
import { ErrorResponse } from './modules/types.ts';

type SuccessResponse = {
  statusCode: number
}

export function handler(
  event: Event,
  _context: Context
): Promise<SuccessResponse | ErrorResponse > {
  const createEvent = new CreateEvent(event);

  return new Promise((resolve, reject) => {
    createEvent.save().then(() => {
      resolve({ statusCode: 200 });
    }).catch((error: Error) => {
      reject({ statusCode: 500, message: error });
    });
  });
}
