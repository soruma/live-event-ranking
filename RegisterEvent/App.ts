import { Context } from "./lib/deps.ts"
import { RegisterEvents } from './RegisterEvents.ts';

type EventParams = {}

export async function handler(
  _event: any,
  _context: Context
): Promise<any> {
  let response;

  try {
    const registerEvents = new RegisterEvents();

    response = await registerEvents.execute();
  } catch (error) {
    console.log(error);
    response = {
      statusCode: 500,
      message: error
    };
  }

  return response;
}
