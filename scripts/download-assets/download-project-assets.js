import { ZeplinApi, Configuration } from '@zeplin/sdk';
import Progress from 'progress';
import axios from 'axios';
import fs from 'fs/promises';
import batchPromises from 'batch-promises';
import { config } from 'dotenv';
import rateLimit from 'axios-rate-limit';
import { Command } from 'commander';

// Set your dotenv config to the root directory where the .env file lives
config({ path: '../../.env' });

// Extract PAT and Workspace from .env
const { PERSONAL_ACCESS_TOKEN } = process.env;

// use Commander to take in options from the command line
const program = new Command();

// Zeplin API rate limit is 200 requests per user per minute.
// Use rateLimit to extend Axios to only make 200 requests per minute (60,000ms)
const http = rateLimit(axios.create(), { maxRequests: 200, perMilliseconds: 60000 });

// Instantiate ZeplinClient with access token, add our http client to the ZeplinClient
const zeplinClient = new ZeplinApi(new Configuration(
  { accessToken: PERSONAL_ACCESS_TOKEN },
  undefined,
  http,
));

const getProjectScreens = async (projectId) => {
  const { data } = await zeplinClient.screens.getProjectScreens(projectId);

  return data;
};

const getAssetData = async (screen, projectId, formats) => {
  const { id, name } = screen;
  const { data } = await zeplinClient.screens
    .getLatestScreenVersion(projectId, id);
  return data.assets.flatMap(({ displayName, contents }) => {
    // remove any asset that are not in the formats defined in PROJECT_OPTIONS.formats
    const filteredContents = contents.filter((content) => (
      formats.includes(content.format)
    ));
    return filteredContents.map(({ url, format, density }) => ({
      name,
      url,
      filename: `${displayName.replaceAll('/', '-')}-${density}x.${format}`,
    }));
  });
};

const downloadAsset = async ({ name, url, filename }, dir, progress) => {
  try {
    const { data } = await axios.get(url, { responseType: 'stream' });
    await fs.mkdir(`${dir}/${name}`, { recursive: true });
    await fs.writeFile(`${dir}/${name}/${filename}`, data);
  } catch (err) {
    console.log(`Error downloading ${name}`);
    console.log(err.config.url);
  }
  progress.tick();
};

const main = async () => {
  // add command line options
  program
    .requiredOption('-p, --projectId <projectId>', 'Project ID')
    .requiredOption('-d, --directory <dir>', 'Output directory')
    .option('-f, --formats <formats...>', 'Formats to download', ['png', 'jpg', 'webp', 'svg', 'pdf']);

  // parse the command line arguments
  await program.parseAsync(process.argv);

  const { projectId, directory, formats } = program.opts();

  const projectScreens = await getProjectScreens(projectId);

  const assets = (await Promise.all(projectScreens.map(
    async (screen) => getAssetData(screen, projectId, formats),
  ))).flat();

  const assetsBar = new Progress('  Downloading project assets [:bar] :rate/bps :percent :etas', {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: assets.length,
  });

  // Remove existing Output folder and create new one at start of script
  await fs.rm(directory, { recursive: true, force: true });
  await fs.mkdir(directory);

  await batchPromises(10, assets, (asset) => downloadAsset(asset, directory, assetsBar));
};

await main();
