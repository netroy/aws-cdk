import * as yargs from 'yargs';
import { CustomTypes, KnownTypeName } from '../api/cxapp/types';
import { data, print } from '../logging';
import { CommandOptions } from '../command-api';

export const command = 'types';
export const describe = 'Manage custom resource types on Cloudformation Registry';
export const aliases = ['type'];
export const builder = {
  list: {
    desc: 'Lists all registered resource types'
  },
  'list-known': {
    desc: 'List all the known third-party resource types'
  },
  init: {
    desc: 'Bootstrap a registrable resource type from a template'
  },
  'register-known <TYPE_NAME>': {
    desc: 'Register a known third-paty resource type'
  }
};

// (yargs: Argv) => yargs

export const handler = (args: yargs.Arguments) => {
  yargs
    .usage("Usage: cdk types COMMAND")
    .command('list', 'Lists all registered resource types')
    .command('init', 'Bootstrap a registrable resource type from a template')
    .command('register ', 'Register a known third-paty resource type');
};

const realHandler = async ({ args, aws }: CommandOptions) => {
  const customTypes = new CustomTypes({ aws });

  async function cliListTypes() {
    const types = await customTypes.listTypes();
    if (types.length) {
      for (const type of types) {
        data(type.TypeName || '');
      }
    } else {
      print('There are currentlly no registered custom types');
    }

    return 0; // exit-code
  }

  async function cliRegisterType(typeName: KnownTypeName) {
    const token = await customTypes.registerKnownType(typeName);
    print(token || '');
  }

  const cmd = args._[0];
  switch (cmd) {
    case 'list-types':
      return await cliListTypes();

    // case 'register-type':
    //   return await cliRegisterType(args.TYPE_NAME);
  }
};
