import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_iam as iam } from 'aws-cdk-lib';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { aws_dynamodb as dynamodb } from 'aws-cdk-lib';
import { aws_events as events }from "aws-cdk-lib";
import { aws_events_targets as events_targets }from "aws-cdk-lib";
import { DenoLayer } from "./deno-layer";
import { FetchEvents, RegisterEvents, RegisterEventRanking, FetchEventsThatUpdateRanking } from "./functions";
import { RegisterEventsStepfunction } from './register-events-step-function';
import { RegisterEventRankingsStepfunction } from './register-event-rankings-step-function';

export class LiveEventRankingStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const liveEventsTable = new dynamodb.Table(this, "LiveEvents", {
      partitionKey: {
        name: "eventId",
        type: dynamodb.AttributeType.NUMBER,
      },
      tableName: "LiveEvents",
    });

    const liveEventRankingHistoriesTable = new dynamodb.Table(this, "LiveEventRankingHistories", {
      partitionKey: {
        name: "eventId",
        type: dynamodb.AttributeType.NUMBER,
      },
      sortKey: {
        name: "SK",
        type: dynamodb.AttributeType.STRING,
      },
      tableName: "LiveEventRankingHistories",
    });

    const denoLayer = new DenoLayer(this);

    const fetchEvents = new FetchEvents(this, denoLayer);

    const registerEvents = new RegisterEvents(this, denoLayer, liveEventsTable)
    registerEvents.function.role?.attachInlinePolicy(
      new iam.Policy(this, "registerEventFunction-inline-policy", {
        statements: [new iam.PolicyStatement({
									actions: ["dynamodb:BatchWriteItem"],
									resources: [liveEventsTable.tableArn],
								})]
      })
    );

    const registerEventsStepfunction = new RegisterEventsStepfunction(this, fetchEvents, registerEvents);
    new events.Rule(this, "RegisterEventsRule", {
      schedule: events.Schedule.cron({minute: "0", hour: "9", day: "*"}),
      targets: [ new events_targets.SfnStateMachine(registerEventsStepfunction.stateMachine) ],
    });

    const fetchEventsThatUpdateRanking = new FetchEventsThatUpdateRanking(this, denoLayer, liveEventsTable, 5400);
    fetchEventsThatUpdateRanking.function.role?.attachInlinePolicy(
      new iam.Policy(this, "fetchEventsThatUpdateRankingFunction-inline-policy", {
        statements: [new iam.PolicyStatement({
                        actions: ["dynamodb:Scan"],
                        resources: [liveEventsTable.tableArn]
                      })]
      })
    );

    const registerEventRanking = new RegisterEventRanking(this, denoLayer, liveEventRankingHistoriesTable);
    registerEventRanking.function.role?.attachInlinePolicy(
      new iam.Policy(this, "registerEventRankingFunction-inline-policy", {
        statements: [new iam.PolicyStatement({
                        actions: ["dynamodb:PutItem"],
                        resources: [liveEventRankingHistoriesTable.tableArn]
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
