import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_iam as iam } from 'aws-cdk-lib';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { aws_dynamodb as dynamodb } from 'aws-cdk-lib';
import { aws_events as events }from "aws-cdk-lib";
import { aws_events_targets as events_targets }from "aws-cdk-lib";
import { DenoLayer } from "./deno-layer";
import { FetchEvents, RegisterEvents, AppendEventDetails, RegisterEventRanking, FetchEventsThatUpdateRanking } from "./functions";
import { RegisterEventsStepfunction } from './register-events-step-function';
import { RegisterEventRankingsStepfunction } from './register-event-rankings-step-function';

export class LiveEventRankingStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const eventRankingHistoriesTable = new dynamodb.Table(this, "EventRankingHistories", {
      partitionKey: {
        name: "eventId",
        type: dynamodb.AttributeType.NUMBER,
      },
      sortKey: {
        name: "attribute",
        type: dynamodb.AttributeType.STRING,
      },
      tableName: "EventRankingHistories",
      stream: dynamodb.StreamViewType.KEYS_ONLY,
      readCapacity: 5,
      writeCapacity: 5
    });

    const channelPoint: dynamodb.GlobalSecondaryIndexProps = {
      indexName: "ChannelPoint",
      partitionKey: { name: "channelId", type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: "timestamp", type: dynamodb.AttributeType.STRING },
      readCapacity: 5,
      writeCapacity: 5
    };
    eventRankingHistoriesTable.addGlobalSecondaryIndex(channelPoint);

    const denoLayer = new DenoLayer(this);

    const fetchEvents = new FetchEvents(this, denoLayer);

    const registerEvents = new RegisterEvents(this, denoLayer, eventRankingHistoriesTable)
    registerEvents.function.role?.attachInlinePolicy(
      new iam.Policy(this, "registerEventFunction-inline-policy", {
        statements: [new iam.PolicyStatement({
									actions: ["dynamodb:BatchWriteItem"],
									resources: [eventRankingHistoriesTable.tableArn],
								})]
      })
    );

    const registerEventsStepfunction = new RegisterEventsStepfunction(this, fetchEvents, registerEvents);
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

    const fetchEventsThatUpdateRanking = new FetchEventsThatUpdateRanking(this, denoLayer, eventRankingHistoriesTable, 5400);
    fetchEventsThatUpdateRanking.function.role?.attachInlinePolicy(
      new iam.Policy(this, "fetchEventsThatUpdateRankingFunction-inline-policy", {
        statements: [new iam.PolicyStatement({
                        actions: ["dynamodb:Scan"],
                        resources: [eventRankingHistoriesTable.tableArn]
                      })]
      })
    );

    const registerEventRanking = new RegisterEventRanking(this, denoLayer, eventRankingHistoriesTable);
    registerEventRanking.function.role?.attachInlinePolicy(
      new iam.Policy(this, "registerEventRankingFunction-inline-policy", {
        statements: [new iam.PolicyStatement({
                        actions: ["dynamodb:PutItem"],
                        resources: [eventRankingHistoriesTable.tableArn]
                      })]
      })
    );

    const registerEventRankingsStepfunction = new RegisterEventRankingsStepfunction(this, fetchEventsThatUpdateRanking, registerEventRanking);
    new events.Rule(this, "RegisterEventRankingsRule", {
      schedule: events.Schedule.cron({minute: "0", hour: "*", day: "*"}),
      targets: [ new events_targets.SfnStateMachine(registerEventRankingsStepfunction.stateMachine) ],
    });
  }
}
