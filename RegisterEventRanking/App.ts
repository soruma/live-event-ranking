import { Context } from "./lib/deps.ts"
import { RegisterEventRankings } from "./RegisterEventRankings.ts"

type EventParams = {
  eventId: string;
}

export async function handler(
  event: EventParams,
  _context: Context
): Promise<any> {
  let response;

  try {
    const eventId = parseInt(event.eventId || "0");
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
