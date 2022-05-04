import { DOMParser } from "./deps.ts";

export class FetchEventDetail {
  eventId: number;
  doc: any;
  html: any;
  res: any;

  constructor(eventId: number) {
    this.eventId = eventId;
  }

  async title(): Promise<string> {
    await this.document();
    
    return JSON.parse(this.doc?.querySelector("#data").attributes["data-event"]).title;
  }

  async rankingType(): Promise<string> {
    await this.document();

    return JSON.parse(this.doc?.querySelector("#data").attributes["data-event"]).rankingType;
  }

  private async document() {
    if (this.doc != undefined) { return this.doc; }

    this.res = await fetch(this.url());
    this.html = await this.res.text();
    this.doc = new DOMParser().parseFromString(this.html, 'text/html');

    return this.doc;
  }

  private url(): string {
    return `https://live.line.me/event/${this.eventId}`;
  }
}
