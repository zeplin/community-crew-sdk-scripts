import { ZeplinApi, Configuration } from '@zeplin/sdk';
import { Command } from 'commander';
import { config } from 'dotenv';
import fs from 'fs/promises';

// Set your dotenv config to the root directory where the .env file lives
config({ path: '../../.env' });

// Extract PAT and colors file path from .env
const { PERSONAL_ACCESS_TOKEN, THEME_COLORS_PATH } = process.env;

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

    // Put colors in module.exports
    const parsedColors = `module.exports = ${JSON.stringify(colors, null, 2).replaceAll('"', "'")}`;
    console.log(parsedColors);

    // Write colors to theme colors file defined in ENV
    fs.writeFile(THEME_COLORS_PATH, parsedColors, 'utf8');
  });

program.parseAsync(process.argv);
