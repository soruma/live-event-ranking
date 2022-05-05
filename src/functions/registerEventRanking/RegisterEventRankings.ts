import { format } from "./deps.ts";
import { CreateEventRanking, EventRanking } from "./CreateEventRanking.ts";
import {
  FetchEventRanking,
  FetchEventRankings,
  FetchEventRankingsFaildResponse,
  FetchEventRankingsSuccessResponse,
} from "./FetchEventRankings.ts";

export interface RegisterEventRankingsStatus {
  status: number;
  count: number;
  message: string;
}

export class RegisterEventRankings {
  private eventId: number;

  constructor(eventId: number) {
    this.eventId = eventId;
  }

  async execute(rowNum = 0): Promise<RegisterEventRankingsStatus> {
    const fetchEventRankings = new FetchEventRankings(this.eventId);
    const response = await fetchEventRankings.execute(rowNum);

    if (response.status != 200) {
      return {
        status: response.status,
        count: 0,
        message: (response as FetchEventRankingsFaildResponse).errorMessage,
      };
    }
    const eventRanking = (response as FetchEventRankingsSuccessResponse);
    const removeedUnnecessaryEventRankings = eventRanking.rows.map((row) => {
      return this.removeUnnecessaryAttributes(row);
    });

    await this.registerEventRankings(removeedUnnecessaryEventRankings);

    let registerCount;
    const last = eventRanking.rows.length - 1;
    const lastRowNum = eventRanking.rows[last].rowNum;
    if (eventRanking.hasNextPage) {
      const result = await this.execute();
      registerCount = result.count;
    } else {
      registerCount = lastRowNum;
    }

    return { status: 200, count: registerCount!, message: "Success" };
  }

  private async registerEventRankings(eventRankings: EventRanking[]) {
    const timestamp = format(new Date(), "yyyy-MM-ddTHH:mm:ss");
    const promises = eventRankings.map((eventRanking) => {
      const createEventRanking = new CreateEventRanking(
        timestamp,
        this.eventId,
        eventRanking,
      );
      return createEventRanking.save();
    });
    await Promise.all(promises).then((value) => {
      console.log(value);
    });
  }

  private removeUnnecessaryAttributes(fetchEventRanking: FetchEventRanking): EventRanking {
    delete fetchEventRanking.rowNum;
    delete fetchEventRanking.nowBroadcasting;
    delete fetchEventRanking.active;
    delete fetchEventRanking.isBlocked;

    return fetchEventRanking as EventRanking;
  }
}
