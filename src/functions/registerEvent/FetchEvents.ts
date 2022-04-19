export class FetchEvents {
  async execute(): Promise<any> {
    const response = await fetch(this.url());
    return response.json();
  }

  private url(): string {
    return `https://live-api.line-apps.com/web/v3.12/events`;
  }
}