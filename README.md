# Live event ranking

## Development

clear dynamodb

```
deno run --allow-run bin/ClearDynamodb.ts
```

local execute for RegisterEvent

```
docker-compose run --rm lambci RegisterEvent/App.handler
```

local execute for RegisterEventRanking

```
docker-compose run --rm lambci RegisterEventRanking/App.handler '{ "eventId": "12112" }'
```

## Deploy

```
DENO_DIR=.deno_dir deno cache RegisterEvent/App.ts
DENO_DIR=.deno_dir deno cache RegisterEventRanking/App.ts
cp -R .deno_dir/gen/file/$PWD/ .deno_dir/LAMBDA_TASK_ROOT
sam deploy --stack-name live-event-ranking --s3-bucket live-event-ranking-code --s3-prefix live-event-ranking --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND
```