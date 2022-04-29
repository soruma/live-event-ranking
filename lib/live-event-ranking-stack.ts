import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_iam as iam } from 'aws-cdk-lib';
import { aws_dynamodb as dynamo } from 'aws-cdk-lib';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { aws_sam as sam } from 'aws-cdk-lib';

const APPLICATION_ID = 'arn:aws:serverlessrepo:us-east-1:390065572566:applications/deno'
const DENO_VERSION = '1.21.0'

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

    const denoRuntime = new sam.CfnApplication(this, `DenoRuntime`, {
      location: {
        applicationId: APPLICATION_ID,
        semanticVersion: DENO_VERSION
      }
    });

    const denoLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      `denoRuntimeLayer`,
      denoRuntime.getAtt('Outputs.LayerArn').toString()
    );

    const fetchEventsFunction = new lambda.Function(this, 'fetchEvents', {
      code: lambda.Code.fromAsset('src/functions/fetchEvents'),
      handler: 'index.handler',
      runtime: lambda.Runtime.PROVIDED_AL2,
      layers: [ denoLayer ],
    });

    const registerEventRankingFunction = new lambda.Function(this, 'registerEventRanking', {
      code: lambda.Code.fromAsset('src/functions/registerEventRanking'),
      handler: 'index.handler',
      runtime: lambda.Runtime.PROVIDED_AL2,
      layers: [ denoLayer ],
      environment: {
        USE_AWS: "true",
        TABLE_NAME: eventRankingHistoriesTable.tableName
      },
      timeout: Duration.seconds(20)
    });

    registerEventRankingFunction.role?.attachInlinePolicy(
      new iam.Policy(this, "registerEventRankingFunction-inline-policy", {
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
      new iam.Policy(this, "registerEventFunction-inline-policy", {
        statements: [eventRankingHistoriesTablePolicy],
      }),
    );
  }
}
