import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_iam as iam } from 'aws-cdk-lib';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { aws_dynamodb as dynamo } from 'aws-cdk-lib';
import { aws_events as events }from "aws-cdk-lib";
import { aws_events_targets as events_targets }from "aws-cdk-lib";
import { DenoLayer } from "./deno-layer";
import { FetchEvents, RegisterEvent, AppendEventDetails, RegisterEventRanking } from "./functions";
import { RegisterEventsStepfunction } from './register-events-step-function';

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
      tableName: "EventRankingHistories",
      stream: dynamo.StreamViewType.KEYS_ONLY
    });

    const channelPoint: dynamo.GlobalSecondaryIndexProps = {
      indexName: "ChannelPoint",
      partitionKey: { name: "ChannelId", type: dynamo.AttributeType.NUMBER },
      sortKey: { name: "Timestamp", type: dynamo.AttributeType.STRING }
    };
    eventRankingHistoriesTable.addGlobalSecondaryIndex(channelPoint);

    const eventRankingHistoriesTablePutPolicy = new iam.PolicyStatement({
      actions: ["dynamodb:PutItem"],
      resources: [eventRankingHistoriesTable.tableArn],
    });

    const denoLayer = new DenoLayer(this);

    const fetchEvents = new FetchEvents(this, denoLayer);

    const registerEvent = new RegisterEvent(this, denoLayer, eventRankingHistoriesTable)
    registerEvent.function.role?.attachInlinePolicy(
      new iam.Policy(this, "registerEventFunction-inline-policy", {
        statements: [eventRankingHistoriesTablePutPolicy],
      }),
    );

    const registerEventRanking = new RegisterEventRanking(this, denoLayer, eventRankingHistoriesTable);
    registerEventRanking.function.role?.attachInlinePolicy(
      new iam.Policy(this, "registerEventRankingFunction-inline-policy", {
        statements: [eventRankingHistoriesTablePutPolicy],
      }),
    );

    const registerEventsStepfunction = new RegisterEventsStepfunction(this, fetchEvents, registerEvent);
    new events.Rule(this, "RegisterEventsRule", {
      schedule: events.Schedule.cron({minute: "0", hour: "9", day: "*"}),
      targets: [ new events_targets.SfnStateMachine(registerEventsStepfunction.stateMachine) ],
    });

    const appendEventDetailsStreamPolicy = new iam.PolicyStatement({
      actions: [
        "dynamodb:DescribeStream",
        "dynamodb:GetRecords",
        "dynamodb:GetShardIterator",
        "dynamodb:ListStreams"
      ],
      resources: [eventRankingHistoriesTable.tableStreamArn!],
    });
    const appendEventDetailsPolicy = new iam.PolicyStatement({
      actions: ["dynamodb:UpdateItem"],
      resources: [eventRankingHistoriesTable.tableArn],
    });

    const appendEventDetails = new AppendEventDetails(this, denoLayer, eventRankingHistoriesTable)
    appendEventDetails.function.role?.attachInlinePolicy(
      new iam.Policy(this, "appendEventDetailsFunction-inline-policy", {
        statements: [appendEventDetailsStreamPolicy, appendEventDetailsPolicy],
      }),
    );

    appendEventDetails.function.addEventSourceMapping("FetchEventRankingHistoriesTableStreamSourceMapping", {
      eventSourceArn: eventRankingHistoriesTable.tableStreamArn,
      batchSize: 10,
      startingPosition: lambda.StartingPosition.LATEST,
    });
  }
}
