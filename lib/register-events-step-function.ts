import { Stack } from 'aws-cdk-lib';
import { aws_stepfunctions as sfn } from 'aws-cdk-lib';
import { aws_stepfunctions_tasks as tasks } from 'aws-cdk-lib';
import { FetchEvents, FetchBlockEvents, RegisterEvents } from './functions';

export class RegisterEventsStepfunction {
  stateMachine: sfn.StateMachine;

  constructor(stack: Stack, fetchEvents: FetchEvents, fetchBlockEvents: FetchBlockEvents, registerEvents: RegisterEvents) {
    // Define Tasks
    const invokeFetchEvents = new tasks.LambdaInvoke(stack, 'Invoke FetchEvents', {
      lambdaFunction: fetchEvents.function,
      outputPath: '$.Payload',
    });

    const invokeRegisterEvents = new tasks.LambdaInvoke(stack, 'Invoke RegisterEvents', {
      lambdaFunction: registerEvents.function,
      outputPath: '$.Payload',
    });

    const invokeRegisterBlockEvents = new tasks.LambdaInvoke(stack, 'Invoke RegisterBlockEvents', {
      lambdaFunction: registerEvents.function,
      outputPath: '$.Payload',
    });

    const invokeFetchBlockEvents = new tasks.LambdaInvoke(stack, 'Invoke FetchBlockEvents', {
      lambdaFunction: fetchBlockEvents.function,
      outputPath: '$.Payload',
    });

    // Define Succeess, Fail, ErrorAndFail states
    const failedState = new sfn.Fail(stack, 'Error for RegisterEventsStateMachine');
    const successState = new sfn.Succeed(stack, 'Success for RegisterEventsStateMachine');

    const registedBlockEventsStatusChoice = new sfn.Choice(stack, "Check response for RegisterBlockEvents")
      .otherwise(failedState)
      .when(sfn.Condition.numberEquals('$.statusCode', 200), successState);

    const fetchedBlockEventsStatusChoice = new sfn.Choice(stack, "Check response for FetchBlockEvents")
      .otherwise(failedState)
      .when(sfn.Condition.numberEquals('$.statusCode', 200),
        invokeRegisterBlockEvents.addCatch(failedState).next(registedBlockEventsStatusChoice));

    const registedEventsStatusChoice = new sfn.Choice(stack, "Check response for RegisterEvents")
      .otherwise(failedState)
      .when(sfn.Condition.numberEquals('$.statusCode', 200),
        invokeFetchBlockEvents.addCatch(failedState).next(fetchedBlockEventsStatusChoice));

    const fetchedEventsStatusChoice = new sfn.Choice(stack, 'Check response for FetchEvents')
      .otherwise(failedState)
      .when(sfn.Condition.numberEquals('$.statusCode', 200),
        invokeRegisterEvents.addCatch(failedState).next(registedEventsStatusChoice)
      );

    // Create StateMachine
    const definition = invokeFetchEvents.addCatch(failedState)
      .next(fetchedEventsStatusChoice);

    this.stateMachine = new sfn.StateMachine(stack, 'RegisterEventsStateMachine', {
      definition: definition,
      stateMachineName: 'RegisterEventsStateMachine',
    });
  }
}
