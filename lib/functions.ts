import { Stack, Duration } from 'aws-cdk-lib';
import { aws_dynamodb as dynamo } from 'aws-cdk-lib';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { DenoLayer } from './deno-layer';

export class FetchEvents {
  function: lambda.Function;

  constructor(stack: Stack, denoLayer: DenoLayer) {
    this.function = new lambda.Function(stack, 'fetchEvents', {
      code: lambda.Code.fromAsset('src/functions/fetchEvents'),
      handler: 'index.handler',
      runtime: lambda.Runtime.PROVIDED_AL2,
      layers: [ denoLayer.arn ],
    });
  }
}

export class RegisterEvent {
  function: lambda.Function;

  constructor(stack: Stack, denoLayer: DenoLayer, eventRankingHistoriesTable: dynamo.Table) {
    this.function = new lambda.Function(stack, 'registerEvent', {
      code: lambda.Code.fromAsset('src/functions/registerEvent'),
      handler: 'index.handler',
      runtime: lambda.Runtime.PROVIDED,
      layers: [ denoLayer.arn ],
      environment: {
        USE_AWS: "true",
        TABLE_NAME: eventRankingHistoriesTable.tableName
      }
    });
  }
}

export class AppendEventDetails {
  function: lambda.Function;

  constructor(stack: Stack, denoLayer: DenoLayer, eventRankingHistoriesTable: dynamo.Table) {
    this.function = new lambda.Function(stack, 'appendEventDetails', {
      code: lambda.Code.fromAsset('src/functions/appendEventDetails'),
      handler: 'index.handler',
      runtime: lambda.Runtime.PROVIDED_AL2,
      layers: [ denoLayer.arn ],
      environment: {
        USE_AWS: "true",
        TABLE_NAME: eventRankingHistoriesTable.tableName
      },
      timeout: Duration.seconds(30),
    });
  }
}

export class RegisterEventRanking {
  function: lambda.Function;

  constructor(stack: Stack, denoLayer: DenoLayer, eventRankingHistoriesTable: dynamo.Table) {
    this.function = new lambda.Function(stack, 'registerEventRanking', {
      code: lambda.Code.fromAsset('src/functions/registerEventRanking'),
      handler: 'index.handler',
      runtime: lambda.Runtime.PROVIDED_AL2,
      layers: [ denoLayer.arn ],
      environment: {
        USE_AWS: "true",
        TABLE_NAME: eventRankingHistoriesTable.tableName
      }
    });
  }
}