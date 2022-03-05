import { format } from "./deps.ts";
import { CreateEventRanking } from "./CreateEventRanking.ts";
import { FetchEventRankings } from "./FetchEventRankings.ts"
export interface RegisterEventRankingsStatus {
  status: number;
  count: number;
}

export class RegisterEventRankings {
  private eventId: number;

  constructor(eventId: number) {
    this.eventId = eventId;
  }

  async execute(rowNum = 0): Promise<RegisterEventRankingsStatus> {
    const fetchEventRankings = new FetchEventRankings(this.eventId);
    const eventRanking = await fetchEventRankings.execute(rowNum);

    if (eventRanking.status != 200) {
      return { status: 500, count: 0 };
    }

    this.registerEventRankings(eventRanking.rows);

    let registerCount;
    const last = eventRanking.rows.length - 1;
    const lastRowNum = eventRanking.rows[last].rowNum;
    if (eventRanking.hasNextPage) {
      const result = await this.execute();
      registerCount = result.count;
    } else {
      registerCount = lastRowNum;
    }

    return { status: 200, count: registerCount };
  }

  private registerEventRankings(eventRankings: any[]) {
    const timestamp = format(new Date(), "yyyy-MM-ddTHH:mm:ss");
    eventRankings.map((eventRanking) => {
      const createEventRanking = new CreateEventRanking(timestamp, this.eventId, eventRanking);
      createEventRanking.save();
    });
  }
}
