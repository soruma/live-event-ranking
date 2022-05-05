import { Event } from "./modules/types.ts"

export type Category = {
  id: number,
  name: string
};

export type FinishedEvents = {
  events: ResponseEvent[],
  apistatusCode: number,
  status: number
};

export type OngoingEvents = {
  canParticipate: ResponseEvent[],
  eventByCategoryId: { [key: string]: ResponseEvent[] },
  endingSoon: ResponseEvent[],
  categories: Category[],
  apistatusCode: number,
  status: number
}

const EventHeldStatusType = {
  finished: "finished",
  ongoing: 'ongoing',
} as const;

export type EventHeldStatusType = typeof EventHeldStatusType[keyof typeof EventHeldStatusType];
export const AllEventHeldStatusType = Object.values(EventHeldStatusType);

export type ResponseEvent = Event & {
  id?: number;
  weight?: number;
  rankingStartAt?: number;
  rankingEndAt?: number;
}

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
