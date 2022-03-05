export class FetchEventRankings {
  private eventId: number;

  constructor(eventId: number) {
    this.eventId = eventId;
  }

  async execute(rowNum: number): Promise<any> {
    const response = await fetch(this.url(rowNum));
    return response.json();
  }

  private url(rowNum: number): string {
    return `https://live-api.line-apps.com/web/v3.7/events/${this.eventId}/ranking?rowNum=${rowNum}`;
  }
}