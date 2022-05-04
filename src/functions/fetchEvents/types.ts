import { Event } from "./modules/types.ts";

export type category = {
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
  categories: category[],
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
