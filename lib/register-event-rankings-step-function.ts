import { Stack } from 'aws-cdk-lib';
import { aws_stepfunctions as sfn } from 'aws-cdk-lib';
import { aws_stepfunctions_tasks as tasks } from 'aws-cdk-lib';
import { FetchEventsThatUpdateRanking, RegisterEventRanking } from './functions';

export class RegisterEventRankingsStepfunction {
  stateMachine: sfn.StateMachine;

  constructor(stack: Stack, fetchEventsThatUpdateRanking: FetchEventsThatUpdateRanking, registerEventRanking: RegisterEventRanking) {
    // Define Tasks
    const fetchEventsThatUpdateRankingTask = new tasks.LambdaInvoke(stack, 'Invoke FetchEventsThatUpdateRanking', {
      lambdaFunction: fetchEventsThatUpdateRanking.function,
      outputPath: '$.Payload',
    });

    const registerEventRankingTask = new tasks.LambdaInvoke(stack, 'Invoke RegisterEventRanking', {
      lambdaFunction: registerEventRanking.function,
      outputPath: '$.Payload',
    });

    // Define Succeess, Fail, ErrorAndFail states
    const stepFailOnErrorState = new sfn.Fail(stack, 'FetchEventsThatUpdateRanking Error and Fail', {
      comment: 'Handle Error and Exit.',
    });
    const iteratorFailOnErrorState = new sfn.Fail(stack, 'Iterator Error and Fail', {
       comment: 'Iterator Error and Exit.',
     });

    const failedState = new sfn.Fail(stack, 'Error for RegisterEventRanking');
    const successState = new sfn.Succeed(stack, 'Success RegisterRankingsStateMachine');

    const eachInvokeRegisterEventRanking = new sfn.Map(stack, 'Each invoke RegisterEventRanking', {
       maxConcurrency: 1,
       itemsPath: sfn.JsonPath.stringAt('$.eventIds'),
     });
     eachInvokeRegisterEventRanking.iterator(registerEventRankingTask.addCatch(iteratorFailOnErrorState));

    const stepSuccessFailBranch = new sfn.Choice(stack, 'Check response for RegisterEventRanking')
      .otherwise(failedState)
      .when(sfn.Condition.numberEquals('$.statusCode', 200), eachInvokeRegisterEventRanking.addCatch(stepFailOnErrorState).next(successState));

    // Create StateMachine
    const definition = fetchEventsThatUpdateRankingTask.addCatch(stepFailOnErrorState)
      .next(stepSuccessFailBranch);

    this.stateMachine = new sfn.StateMachine(stack, 'RegisterRankingsStateMachine', {
      definition: definition,
      stateMachineName: 'RegisterRankingsStateMachine',
    });
  }
}