import { Stack } from 'aws-cdk-lib';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { aws_sam as sam } from 'aws-cdk-lib';

export class DenoLayer {
  APPLICATION_ID = 'arn:aws:serverlessrepo:us-east-1:390065572566:applications/deno'
  DENO_VERSION = '1.21.0'
  arn: any;

  constructor(stack: Stack) {
    const denoRuntime = new sam.CfnApplication(stack, `DenoRuntime`, {
      location: {
        applicationId: this.APPLICATION_ID,
        semanticVersion: this.DENO_VERSION
      }
    });

    this.arn = lambda.LayerVersion.fromLayerVersionArn(
      stack,
      `denoRuntimeLayer`,
      denoRuntime.getAtt('Outputs.LayerArn').toString()
    );
  }
}