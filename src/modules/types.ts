export type ErrorResponse = {
  statusCode: number,
  message: string
};

export type Event = {
  eventId: number,
  title: string,
  bannerImageURL: URL
  startAt: number,
  endAt: number,
  rankingType: string
};
