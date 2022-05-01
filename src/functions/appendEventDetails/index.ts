import { Context } from "./deps.ts"
import { ErrorResponse } from "./modules/types.ts";
import { FetchEventDetail } from './FetchEventDetail.ts';
import { UpdateEventDetail } from "./UpdateEventDetail.ts"

type SuccessResponse = {
  statusCode: number
};

export async function handler(
  event: any,
  _context: Context
): Promise<SuccessResponse | ErrorResponse> {
  console.log(`event: ${JSON.stringify(event)}`);

  const updateEventValues = await Promise.all(event["Records"].map(async (record: any) => {
    if (record["eventName"] != "INSERT") { return { statusCode: 404 }; }

    const eventId = parseInt(record["dynamodb"]["Keys"]["EventId"]["N"]);
    const fetchEventDetail = new FetchEventDetail(eventId);

    return { statusCode: 200, eventId: eventId, title: await fetchEventDetail.title() };
  }));

  await Promise.all(updateEventValues.map(async (updateEventValue: any) => {
    if (updateEventValue.statusCode != 200) { return; }

    const updateEventDetail = new UpdateEventDetail({
      eventId: updateEventValue.eventId,
      title: updateEventValue.title,
    });
    return await updateEventDetail.save();
  }));

  return { statusCode: 200 };
}
