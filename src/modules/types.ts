export type ErrorResponse = {
  statusCode: number,
  message: string
};

export type Event = {
  id: number,
  title: string,
  categoryId: number,
  categoryName: string,
  bannerImageURL: URL,
  weight: number,
  startAt: number,
  endAt: number,
  rankingStartAt: number,
  rankingEndAt: number,
  linkToDetailPage: boolean
};
