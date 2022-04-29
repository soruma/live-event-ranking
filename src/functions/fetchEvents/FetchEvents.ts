import { EventHeldStatusType, OngoingEvents, FinishedEvents } from './types.ts';

export class FetchEvents {
  finishedEvents(): Promise<FinishedEvents> {
    return new Promise((resolve) => {
      fetch(FetchEvents.url("finished")).then((response) => {
        resolve(response.json());
      });
    });
  }

  ongoingEvents(): Promise<OngoingEvents> {
    return new Promise((resolve) => {
      fetch(FetchEvents.url("ongoing")).then((response) => {
        resolve(response.json());
      });
    });
  }

  private static url(eventHeldStatusType: EventHeldStatusType): string {
    return `https://live-api.line-apps.com/web/v5.2/events/${eventHeldStatusType}/all`;
  }
}
