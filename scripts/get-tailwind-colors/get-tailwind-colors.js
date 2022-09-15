import { ZeplinApi, Configuration } from '@zeplin/sdk';
import { Command } from 'commander';
import { config } from 'dotenv';

// Set your dotenv config to the root directory where the .env file lives
config({ path: '../../.env' });

// Extract PAT and Workspace from .env
const { PERSONAL_ACCESS_TOKEN } = process.env;

// use Commander to take in options from the command line
const program = new Command();

// Instantiate zeplin with access token, add our http client to the zeplin

const zeplin = new ZeplinApi(new Configuration({ accessToken: PERSONAL_ACCESS_TOKEN }));

const getStyleguideColors = async (styleguideId) => {
  const { data } = await zeplin.colors.getStyleguideColors(styleguideId);
  const colors = data.reduce((prev, color) => {
    const {
      name,
      r,
      g,
      b,
    } = color;

    return { ...prev, [name.toLowerCase()]: `rgb(${r},${g},${b})` };
  }, {});

  return JSON.stringify(colors, null, 2);
};

program
  .requiredOption('-s, --styleguideId <styleguideId>', 'Styleguide ID')
  .action(async ({ styleguideId }) => {
    const colors = await getStyleguideColors(styleguideId);

    console.log(colors);
  });

program.parse(process.argv);
