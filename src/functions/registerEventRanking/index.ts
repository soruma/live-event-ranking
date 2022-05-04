
import { Context } from "./deps.ts"
import { RegisterEventRankings } from "./RegisterEventRankings.ts"


export async function handler(
  event: string,
  _context: Context
): Promise<any> {
  let response;

  try {
    console.log(event);
    const eventId = parseInt(event || "0");
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