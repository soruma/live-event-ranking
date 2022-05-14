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
      timeout: Duration.seconds(30)
    });
  }
}

export class FetchBlockEvents {
  function: lambda.Function;

  constructor(stack: Stack, denoLayer: DenoLayer, table: dynamo.Table, graceToExcludeEvents: number) {
    this.function = new lambda.Function(stack, 'fetchBlockEvents', {
      code: lambda.Code.fromAsset('src/functions/fetchBlockEvents'),
      handler: 'index.handler',
      runtime: lambda.Runtime.PROVIDED_AL2,
      layers: [ denoLayer.arn ],
      environment: {
        USE_AWS: "true",
        TABLE_NAME: table.tableName,
        GRACE_TO_EXCLUDE_EVENTS: graceToExcludeEvents.toString()
      },
      memorySize: 256,
      timeout: Duration.seconds(10)
    });
  }
}

export class RegisterEvents {
  function: lambda.Function;

  constructor(stack: Stack, denoLayer: DenoLayer, table: dynamo.Table) {
    this.function = new lambda.Function(stack, 'registerEvents', {
      code: lambda.Code.fromAsset('src/functions/registerEvents'),
      handler: 'index.handler',
      runtime: lambda.Runtime.PROVIDED_AL2,
      layers: [ denoLayer.arn ],
      environment: {
        USE_AWS: "true",
        TABLE_NAME: table.tableName
      }
    });
  }
}

export class FetchEventsThatUpdateRanking {
  function: lambda.Function;

  constructor(stack: Stack, denoLayer: DenoLayer, table: dynamo.Table, graceToExcludeEvents: number) {
    this.function = new lambda.Function(stack, 'fetchEventsThatUpdateRanking', {
      code: lambda.Code.fromAsset('src/functions/fetchEventsThatUpdateRanking'),
      handler: 'index.handler',
      runtime: lambda.Runtime.PROVIDED_AL2,
      layers: [ denoLayer.arn ],
      environment: {
        USE_AWS: "true",
        TABLE_NAME: table.tableName,
        GRACE_TO_EXCLUDE_EVENTS: graceToExcludeEvents.toString()
      }
    });
  }
}

export class RegisterEventRanking {
  function: lambda.Function;

  constructor(stack: Stack, denoLayer: DenoLayer, table: dynamo.Table) {
    this.function = new lambda.Function(stack, 'registerEventRanking', {
      code: lambda.Code.fromAsset('src/functions/registerEventRanking'),
      handler: 'index.handler',
      runtime: lambda.Runtime.PROVIDED_AL2,
      layers: [ denoLayer.arn ],
      environment: {
        USE_AWS: "true",
        TABLE_NAME: table.tableName
      },
      timeout: Duration.seconds(60)
    });
  }
}