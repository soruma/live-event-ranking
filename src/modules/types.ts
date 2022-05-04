export type ErrorResponse = {
  statusCode: number,
  message: string
};

export type Event = {
  eventId: number,
  title: string,
  categoryId: number,
  categoryName: string,
  bannerImageURL: URL
  startAt: number,
  endAt: number,
  linkToDetailPage: boolean
};
