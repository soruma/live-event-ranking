import { Event } from "./modules/types.ts";

export type category = {
  id: number,
  name: string
};

export type FinishedEvents = {
  events: [Event],
  apistatusCode: number,
  status: number
};

export type OngoingEvents = {
  canParticipate: Event[],
  eventByCategoryId: { [key: string]: Event[] },
  endingSoon: Event[],
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

export type ErrorResponse = {
  statusCode: number,
  message: string
}