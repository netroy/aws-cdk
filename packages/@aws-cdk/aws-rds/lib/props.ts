import ec2 = require('@aws-cdk/aws-ec2');
import { IClusterParameterGroup } from './cluster-parameter-group';
import { CfnDBCluster } from './rds.generated';

/**
 * Is this Cluster provisioned, or Serverless
 */
export enum DatabaseClusterEngineMode {
  Provisioned = "provisioned",
  Serverless = "serverless"
}

/**
 * The engine for the database cluster
 */
export enum DatabaseClusterEngine {
  Aurora = 'aurora', // Aurora MySQL 5.6
  AuroraMysql = 'aurora-mysql', // Aurora MySQL 5.7
  AuroraPostgresql = 'aurora-postgresql',
  Neptune = 'neptune'
}

/**
 * Instance properties for database instances
 */
export interface InstanceProps {
  /**
   * What type of instance to start for the replicas
   */
  instanceType: ec2.InstanceType;
}

/**
 * VPC props for both provisioned, as well as serverless clusters
 */
export interface VpcProps {
  /**
   * What subnets to run the RDS instances in.
   *
   * Must be at least 2 subnets in two different AZs.
   */
  vpc: ec2.IVpcNetwork;

  /**
   * Where to place the instances within the VPC
   */
  vpcPlacement?: ec2.VpcPlacementStrategy;
}

/**
 * Backup configuration for RDS databases
 */
export interface BackupProps {

  /**
   * How many days to retain the backup
   */
  retentionDays: number;

  /**
   * A daily time range in 24-hours UTC format in which backups preferably execute.
   *
   * Must be at least 30 minutes long.
   *
   * Example: '01:00-02:00'
   */
  preferredWindow?: string;
}

/**
 * Username and password combination
 */
export interface Login {
  /**
   * Username
   */
  username: string;

  /**
   * Password
   *
   * Do not put passwords in your CDK code directly. Import it from a Stack
   * Parameter or the SSM Parameter Store instead.
   */
  password: string;
}

/**
 * Type for database parameters
 */
export type Parameters = {[key: string]: any};

/**
 * Properties for a new database cluster
 */
export interface BaseClusterProps {
  /**
   * What kind of database to start
   */
  engine: DatabaseClusterEngine;

  /**
   * VPC configuration for both provisioned, as well as serverless clusters
   */
  vpcProps: VpcProps,

  /**
   * Username and password for the administrative user
   */
  masterUser: Login;

  /**
   * Backup settings
   */
  backup?: BackupProps;

  /**
   * What port to listen on
   *
   * If not supplied, the default for the engine is used.
   */
  port?: number;

  /**
   * An optional identifier for the cluster
   *
   * If not supplied, a name is automatically generated.
   */
  clusterIdentifier?: string;

  /**
   * Base identifier for instances
   *
   * Every replica is named by appending the replica number to this string, 1-based.
   *
   * If not given, the clusterIdentifier is used with the word "Instance" appended.
   *
   * If clusterIdentifier is also not given, the identifier is automatically generated.
   */
  instanceIdentifierBase?: string;

  /**
   * Name of a database which is automatically created inside the cluster
   */
  defaultDatabaseName?: string;

  /**
   * Additional parameters to pass to the database engine
   *
   * @default No parameter group
   */
  parameterGroup?: IClusterParameterGroup;

  /**
   * A daily time range in 24-hours UTC format in which backups preferably execute.
   *
   * Must be at least 30 minutes long.
   *
   * Example: '01:00-02:00'
   */
  preferredMaintenanceWindow?: string;
}

/**
 * Properties specific to clusters with provisioned instances
 */
export interface ProvisionedClusterProps extends BaseClusterProps {
  /**
   * Settings for the individual instances that are launched
   */
  instanceProps: InstanceProps;

  /**
   * How many replicas/instances to create
   *
   * Has to be at least 1.
   *
   * @default 2
   */
  instances?: number;

  /**
   * ARN of KMS key if you want to enable storage encryption
   */
  kmsKeyArn?: string;
}

/**
 * Properties specific to serverless clusters
 */
export interface ServerlessClusterProps extends BaseClusterProps {
  /**
   * What engine to use for this serverless cluster
   * Aurora-Mysql-5.6 is the Only supported engine for serverless clusters, right now
   */
  engine: DatabaseClusterEngine.Aurora;

  /**
   * How should a serverless cluster auto-scale
   */
  scalingConfiguration?: CfnDBCluster.ScalingConfigurationProperty;
}
