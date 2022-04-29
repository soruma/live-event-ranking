await Deno.run({ cmd: ["docker-compose", "stop"] }).status();
await Deno.run({ cmd: ["rm", "-rf", "tmp/docker/dynamodb"] }).status();
await Deno.run({ cmd: ["docker-compose", "up", "-d"] }).status();
await Deno.run({ cmd: ["npx", "sam-dyamodb-create-table", "-e", "http://localhost:8000", "-f", "cdk.out/LiveEventRankingStack.template.json"] }).status();
