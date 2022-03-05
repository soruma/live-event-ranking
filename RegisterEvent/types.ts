type EventsResponse = {
  status: number;
  apistatusCode: number;
  hasNextPage: boolean;
  categories: Category[];
}

type Category = {
  id: number;
  name: string;
  categoryOrder: number;
  rows: LiveEvent[];
}

type LiveEvent = {
  id: number,
  title: string,
  bannerImageURL: string,
  weight: number,
  startAt: number,
  endAt: number,
  rankingStartAt: number,
  rankingEndAt: number,
  participantCount: number
}
