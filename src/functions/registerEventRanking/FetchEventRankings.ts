export type FetchEventRanking = {
  rowNum?: number,
  rank: number,
  channelId: number,
  channelIconURL: string,
  channelName: string,
  point: number,
  followerCount: number,
  nowBroadcasting?: boolean,
  active?: boolean,
  isBlocked?: boolean
}

export type FetchEventRankingsSuccessResponse = {
  status: number,
  hasNextPage: boolean,
  rows: FetchEventRanking[]
}

export type FetchEventRankingsFaildResponse = {
  status: number,
  errorMessage: string
}


export class FetchEventRankings {
  private eventId: number;

  constructor(eventId: number) {
    this.eventId = eventId;
  }

  async execute(rowNum: number): Promise<FetchEventRankingsSuccessResponse | FetchEventRankingsFaildResponse> {
    const response = await fetch(this.url(rowNum));
    return response.json();
  }

  private url(rowNum: number): string {
    return `https://live-api.line-apps.com/web/v3.7/events/${this.eventId}/ranking?rowNum=${rowNum}`;
  }
}