import { format } from "./lib/deps.ts";
import { CreateEvent } from './CreateEvent.ts';
import { FetchEvents } from "./FetchEvents.ts";

export class RegisterEvents {
  async execute(): Promise<any> {
    const fetchEvents = new FetchEvents();
    const eventsResponse: EventsResponse = await fetchEvents.execute();

    if (eventsResponse.status != 200) {
      return { status: 500, count: 0 };
    }

    const numberOfRegisteredCases = this.registerCategories(eventsResponse.categories);
    return { status: 200, count: numberOfRegisteredCases };
  }

  private registerCategories(categories: Category[]): number {
    const timestamp = format(new Date(), "yyyy-MM-ddTHH:mm:ss");
    let numberOfRegisteredCases = 0;

    categories.map(category => {
      category.rows.map(event => {
        const createEvent = new CreateEvent(timestamp, event);
        createEvent.save();
        numberOfRegisteredCases += 1;
      })
    });

    return numberOfRegisteredCases;
  }
}
