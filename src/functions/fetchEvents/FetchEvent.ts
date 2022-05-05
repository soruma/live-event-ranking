import { DOMParser } from "./deps.ts";
import { Event } from "./modules/types.ts"

export class FetchEvent {
  eventId: number;

  constructor(eventId: number) {
    this.eventId = eventId;
  }

  async fetch(): Promise<Event> {
    const res = await fetch(this.url());
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html')!;
    const dataEvent = JSON.parse(doc.querySelector("#data")!.attributes["data-event"]);

    return {
      eventId: dataEvent.id,
      title: dataEvent.title.replaceAll("“", "").replaceAll("”", "").replaceAll("'", ""),
      bannerImageURL: dataEvent.bannerImageURL,
      startAt: dataEvent.startAt,
      endAt: dataEvent.endAt,
      rankingType: dataEvent.rankingType,
    }
  }

  private url(): string {
    return `https://live.line.me/event/${this.eventId}`;
  }
}
