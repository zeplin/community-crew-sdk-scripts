import { ZeplinApi, Configuration } from '@zeplin/sdk';
import { Command } from 'commander';
import { config } from 'dotenv';

// Set your dotenv config to the root directory where the .env file lives
config({ path: '../../.env' });

// Extract PAT and Workspace from .env
const { PERSONAL_ACCESS_TOKEN } = process.env;

// Use Commander to take in options from the command line
const program = new Command();

// Instantiate zeplin with access token

const zeplin = new ZeplinApi(new Configuration({ accessToken: PERSONAL_ACCESS_TOKEN }));

const getDesignTokenColors = async (styleguideId) => {
  const { data: { colors } } = await zeplin.designTokens.getStyleguideDesignTokens(styleguideId);

  // Format colors object for use in Tailwind config
  return Object.entries(colors).reduce((prev, [color, { value }]) => (
    { ...prev, [color]: value }
  ), {});
};

program
  .requiredOption('-s, --styleguideId <styleguideId>', 'Styleguide ID')
  .action(async ({ styleguideId }) => {
    const colors = await getDesignTokenColors(styleguideId);

    // Present results to command line for manual copy into Tailwind config
    console.log(JSON.stringify(colors, null, 2));
  });

program.parseAsync(process.argv);
