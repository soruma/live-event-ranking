
import { Context } from "./deps.ts"
import { RegisterEventRankings } from "./RegisterEventRankings.ts"

type EventParam = {
  eventId: number
};

export async function handler(
  event: EventParam,
  _context: Context
): Promise<any> {
  let response;

  try {
    console.log(event);
    const eventId = event.eventId;
    const rankings = new RegisterEventRankings(eventId);

    response = await rankings.execute();
  } catch (error) {
    console.log(error);
    response = {
      statusCode: 500,
      message: error
    };
  }

  return response;
}