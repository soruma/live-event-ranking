import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_iam as iam } from 'aws-cdk-lib';
import { aws_dynamodb as dynamo } from 'aws-cdk-lib';
import { DenoLayer } from "./deno-layer";
import { FetchEvent, RegisterEvent, RegisterEventRanking } from "./functions"

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

    const denoLayer = new DenoLayer(this);

    const fetchEvents = new FetchEvent(this, denoLayer);

    const registerEvent = new RegisterEvent(this, denoLayer, eventRankingHistoriesTable)
    registerEvent.function.role?.attachInlinePolicy(
      new iam.Policy(this, "registerEventFunction-inline-policy", {
        statements: [eventRankingHistoriesTablePolicy],
      }),
    );

    const registerEventRanking = new RegisterEventRanking(this, denoLayer, eventRankingHistoriesTable);
    registerEventRanking.function.role?.attachInlinePolicy(
      new iam.Policy(this, "registerEventRankingFunction-inline-policy", {
        statements: [eventRankingHistoriesTablePolicy],
      }),
    );
  }
}
