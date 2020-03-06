import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as ecs from '@aws-cdk/aws-ecs';
import * as iam from '@aws-cdk/aws-iam';
import { Construct } from '@aws-cdk/core';
import { Action } from '../action';
import { deployArtifactBounds } from '../common';

interface BaseEcsDeployActionProps extends codepipeline.CommonAwsActionProps {
  /**
   * The input artifact that contains the JSON image definitions file to use for deployments.
   * The JSON file is a list of objects,
   * each with 2 keys: `name` is the name of the container in the Task Definition,
   * and `imageUri` is the Docker image URI you want to update your service with.
   * If you use this property, it's assumed the file is called 'imagedefinitions.json'.
   * If your build uses a different file, leave this property empty,
   * and use the `imageFile` property instead.
   *
   * @default - one of this property, or `imageFile`, is required
   * @see https://docs.aws.amazon.com/codepipeline/latest/userguide/pipelines-create.html#pipelines-create-image-definitions
   */
  readonly input?: codepipeline.Artifact;
  /**
   * The name of the JSON image definitions file to use for deployments.
   * The JSON file is a list of objects,
   * each with 2 keys: `name` is the name of the container in the Task Definition,
   * and `imageUri` is the Docker image URI you want to update your service with.
   * Use this property if you want to use a different name for this file than the default 'imagedefinitions.json'.
   * If you use this property, you don't need to specify the `input` property.
   *
   * @default - one of this property, or `input`, is required
   * @see https://docs.aws.amazon.com/codepipeline/latest/userguide/pipelines-create.html#pipelines-create-image-definitions
   */
  readonly imageFile?: codepipeline.ArtifactPath;
}

/**
 * Construction properties of {@link EcsDeployAction}.
 */
export interface EcsDeployActionByServiceProps extends BaseEcsDeployActionProps {
  /**
   * The ECS Service to deploy.
   */
  readonly service: ecs.BaseService;
}

/**
 * Construction properties of {@link EcsDeployAction}.
 */
export interface EcsDeployActionByNamesProps extends BaseEcsDeployActionProps {
  /**
   * Name of the ECS Cluster to deploy to.
   */
  readonly clusterName: string;

  /**
   * Name of the ECS Service to deploy.
   */
  readonly serviceName: string;
}

/**
 * Construction properties of {@link EcsDeployAction}.
 */
export type EcsDeployActionProps = EcsDeployActionByServiceProps | EcsDeployActionByNamesProps;

/**
 * CodePipeline Action to deploy an ECS Service.
 */
export class EcsDeployAction extends Action {
  private readonly props: EcsDeployActionProps;

  constructor(props: EcsDeployActionProps) {
    super({
      ...props,
      category: codepipeline.ActionCategory.DEPLOY,
      provider: 'ECS',
      artifactBounds: deployArtifactBounds(),
      inputs: [determineInputArtifact(props)],
      resource: ('service' in props) ? props.service : undefined
    });
    this.props = props;
  }

  protected bound(_scope: Construct, _stage: codepipeline.IStage, options: codepipeline.ActionBindOptions):
      codepipeline.ActionConfig {
    // permissions based on CodePipeline documentation:
    // https://docs.aws.amazon.com/codepipeline/latest/userguide/how-to-custom-role.html#how-to-update-role-new-services
    options.role.addToPolicy(new iam.PolicyStatement({
      actions: [
        'ecs:DescribeServices',
        'ecs:DescribeTaskDefinition',
        'ecs:DescribeTasks',
        'ecs:ListTasks',
        'ecs:RegisterTaskDefinition',
        'ecs:UpdateService',
      ],
      resources: ['*']
    }));

    options.role.addToPolicy(new iam.PolicyStatement({
      actions: ['iam:PassRole'],
      resources: ['*'],
      conditions: {
        StringEqualsIfExists: {
          'iam:PassedToService': [
            'ec2.amazonaws.com',
            'ecs-tasks.amazonaws.com',
          ],
        }
      }
    }));

    options.bucket.grantRead(options.role);

    const props = this.props;
    const configuration: any = {
      FileName: props.imageFile?.fileName,
    };
    if ('service' in props) {
      configuration.ClusterName = props.service.cluster.clusterName;
      configuration.ServiceName = props.service.serviceName;
    } else {
      configuration.ClusterName = props.clusterName;
      configuration.ServiceName = props.serviceName;
    }
    return { configuration };
  }
}

function determineInputArtifact(props: EcsDeployActionProps): codepipeline.Artifact {
  if (props.imageFile && props.input) {
    throw new Error("Exactly one of 'input' or 'imageFile' can be provided in the ECS deploy Action");
  }
  if (props.imageFile) {
    return props.imageFile.artifact;
  }
  if (props.input) {
    return props.input;
  }
  throw new Error("Specifying one of 'input' or 'imageFile' is required for the ECS deploy Action");
}
