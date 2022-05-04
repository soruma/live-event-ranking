import { Event } from "./modules/types.ts"

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
  rows: Event[];
}
