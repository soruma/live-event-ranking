import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_iam as iam } from 'aws-cdk-lib';
import { aws_dynamodb as dynamo } from 'aws-cdk-lib';
import { aws_lambda as lambda } from 'aws-cdk-lib';

export class LiveEventRankingStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const eventRankingHistoriesTable = new dynamo.Table(this, "EventRankingHistories", {
      partitionKey: {
        name: "EventId",
        type: dynamo.AttributeType.NUMBER,
      },
      sortKey: {
        name: "Attribute",
        type: dynamo.AttributeType.STRING,
      },
      tableName: "EventRankingHistories"
    });

    const channelPoint: dynamo.GlobalSecondaryIndexProps = {
      indexName: "ChannelPoint",
      partitionKey: { name: "ChannelId", type: dynamo.AttributeType.NUMBER },
      sortKey: { name: "Timestamp", type: dynamo.AttributeType.STRING }
    };
    eventRankingHistoriesTable.addGlobalSecondaryIndex(channelPoint);

    const eventRankingHistoriesTablePolicy = new iam.PolicyStatement({
      actions: ["dynamodb:PutItem"],
      resources: [eventRankingHistoriesTable.tableArn],
    });

    const denoLayer = new lambda.LayerVersion(this, 'deno-layer', {
      code: lambda.Code.fromAsset('src/layer'),
      compatibleRuntimes: [lambda.Runtime.PROVIDED],
      license: 'Apache-2.0',
      description: 'A layer that enebales Deno to run in lambda',
    });

    const registerEventRankingFunction = new lambda.Function(this, 'registerEventRanking', {
      code: lambda.Code.fromAsset('src/functions/registerEventRanking'),
      handler: 'index.handler',
      runtime: lambda.Runtime.PROVIDED,
      layers: [ denoLayer ],
      environment: {
        USE_AWS: "true",
        TABLE_NAME: eventRankingHistoriesTable.tableName
      },
      timeout: Duration.seconds(20)
    });

    registerEventRankingFunction.role?.attachInlinePolicy(
      new iam.Policy(this, "registerEventRankingFunction-put-item-policy", {
        statements: [eventRankingHistoriesTablePolicy],
      }),
    );

    const registerEventFunction = new lambda.Function(this, 'registerEvent', {
      code: lambda.Code.fromAsset('src/functions/registerEvent'),
      handler: 'index.handler',
      runtime: lambda.Runtime.PROVIDED,
      layers: [ denoLayer ],
      environment: {
        USE_AWS: "true",
        TABLE_NAME: eventRankingHistoriesTable.tableName
      },
      timeout: Duration.seconds(20)
    });

    registerEventFunction.role?.attachInlinePolicy(
      new iam.Policy(this, "registerEventFunction-put-item-policy", {
        statements: [eventRankingHistoriesTablePolicy],
      }),
    );
  }
}
