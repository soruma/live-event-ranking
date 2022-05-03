import { Stack } from 'aws-cdk-lib';
import { aws_stepfunctions as sfn } from 'aws-cdk-lib';
import { aws_stepfunctions_tasks as tasks } from 'aws-cdk-lib';
import { FetchEvents, RegisterEvents } from './functions';

export class RegisterEventsStepfunction {
  stateMachine: sfn.StateMachine;

  constructor(stack: Stack, fetchEvents: FetchEvents, registerEvents: RegisterEvents) {
    // Define Tasks
    const fetchEventsTask = new tasks.LambdaInvoke(stack, 'Invoke FetchEvents', {
      lambdaFunction: fetchEvents.function,
      outputPath: '$.Payload',
    });

    const registerEventsTask = new tasks.LambdaInvoke(stack, 'Invoke RegisterEvents', {
      lambdaFunction: registerEvents.function,
      outputPath: '$.Payload',
    });

    // Define Succeess, Fail, ErrorAndFail states
    const stepFailOnErrorState = new sfn.Fail(stack, 'Handle Error and Fail.', {
      comment: 'Handle Error and Exit.',
    });

    const failedState = new sfn.Fail(stack, 'Error for FetchEvents');
    const successState = new sfn.Succeed(stack, 'Success');

    const stepSuccessFailBranch = new sfn.Choice(stack, 'Check response for FetchEvents')
      .otherwise(failedState)
      .when(sfn.Condition.numberEquals('$.statusCode', 200), registerEventsTask.addCatch(stepFailOnErrorState).next(successState));

    // Create StateMachine
    const definition = fetchEventsTask.addCatch(stepFailOnErrorState)
      .next(stepSuccessFailBranch);

    this.stateMachine = new sfn.StateMachine(stack, 'RegisterEventsStateMachine', {
      definition: definition,
      stateMachineName: 'RegisterEventsStateMachine',
  });
  }
}
