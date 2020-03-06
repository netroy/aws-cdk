import { TypeSummaries, RegistrationToken } from 'aws-sdk/clients/cloudformation';

import { ISDK } from '../util/sdk';
import { Mode } from '../aws-auth/credentials';

export interface CustomTypesProps {
  /**
   * AWS object (used by synthesizer and contextprovider)
   */
  aws: ISDK;
}

enum KnownType {
  'Atlassian::Opsgenie::User' = 's3://opsgeniedownloads/cloudformation/atlassian-opsgenie-user.zip',
  'Atlassian::Opsgenie::Team' = 's3://opsgeniedownloads/cloudformation/atlassian-opsgenie-team.zip',
  'Atlassian::Opsgenie::Integration' = 's3://opsgeniedownloads/cloudformation/atlassian-opsgenie-integration.zip',

  'Datadog::Integrations::AWS' = 's3://datadog-cloudformation-resources/datadog-integrations-aws/datadog-integrations-aws-1.0.1.zip',
  'Datadog::Monitors::Monitor' = 's3://datadog-cloudformation-resources/datadog-monitors-monitor/datadog-monitors-monitor-1.0.2.zip',
  'Datadog::Monitors::Downtime' = 's3://datadog-cloudformation-resources/datadog-monitors-downtime/datadog-monitors-downtime-1.0.1.zip',
  'Datadog::IAM::User' = 's3://datadog-cloudformation-resources/datadog-iam-user/datadog-iam-user-1.0.1.zip',

  'Densify::Optimization::Recommendation' = 's3://cloudformation-optimization-as-code/densify-optimization-recommendation.zip',

  'Dynatrace::Installer::Agent' = 's3://aws-dynatrace-oneagent-installer/dynatrace-installer-agent-handler-1.0-SNAPSHOT.zip',

  'Fortinet::FortiGate::SystemAdmin' = 's3://cloudformation-resource-provider/fortinet-fortigate-systemadmin.zip',
  'Fortinet::FortiGate::SystemDns' = 's3://cloudformation-resource-provider/fortinet-fortigate-systemdns.zip',
  'Fortinet::FortiGate::SystemInterface' = 's3://cloudformation-resource-provider/fortinet-fortigate-systeminterface.zip',

  'NewRelic::Alerts::NrqlAlert' = 's3://nr-cloudformation-downloads/newrelic-alerts-nrqlalert.zip',

  'Spotinst::Elastigroup::Group' = 's3://spotinst-public/integrations/cloudFormation/registry/spotinst-elastigroup-group.zip',
}

export type KnownTypeName = keyof typeof KnownType;

export class CustomTypes {
  constructor(private readonly props: CustomTypesProps) {}

  public async listTypes(): Promise<TypeSummaries> {
    const { aws } = this.props;
    const account = await aws.defaultAccount();
    const region = await aws.defaultRegion();
    const cfn = await aws.cloudFormation(account, region, Mode.ForReading);
    const result = await cfn.listTypes().promise();
    return result.TypeSummaries || [];
  }

  public async registerKnownType(typeName: KnownTypeName): Promise<RegistrationToken | undefined> {
    if (typeName in KnownType) {
      const { aws } = this.props;
      const account = await aws.defaultAccount();
      const region = await aws.defaultRegion();
      const cfn = await aws.cloudFormation(account, region, Mode.ForWriting);
      const result = await cfn.registerType({
        Type: 'RESOURCE',
        TypeName: typeName,
        SchemaHandlerPackage: KnownType[typeName]
      }).promise();
      return result.RegistrationToken;
    } else {
      throw new TypeError(`'${typeName}' is not a known resource type`);
    }
  }
}
