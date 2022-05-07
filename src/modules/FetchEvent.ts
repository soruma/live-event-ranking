import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.22-alpha/deno-dom-wasm.ts';
import { Event } from "./types.ts"

export class FetchEvent {
  eventId: number;
  // deno-lint-ignore no-explicit-any
  dataEvent: any;

  constructor(eventId: number) {
    this.eventId = eventId;
  }

  async fetch(): Promise<Event> {
    const res = await fetch(this.url());
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html')!;
    this.dataEvent = JSON.parse(doc.querySelector("#data")!.attributes["data-event"]);

    return {
      eventId: this.dataEvent.id,
      title: this.dataEvent.title.replaceAll("“", "").replaceAll("”", "").replaceAll("'", ""),
      bannerImageURL: this.dataEvent.bannerImageURL,
      startAt: this.dataEvent.startAt,
      endAt: this.dataEvent.endAt,
      rankingType: this.dataEvent.rankingType,
    };
  }

  private url(): string {
    return `https://live.line.me/event/${this.eventId}`;
  }
}
