import {
  ClientConfig
} from "./deps.ts";

export function localClientConfig(): ClientConfig {
  return {
    region: "local",
    host: "dynamodb-local",
    credentials: {
      accessKeyId: "dummy",
      secretAccessKey: "dummy"
    }
  };
}