import { ZeplinApi, Configuration } from '@zeplin/sdk';
import Progress from 'progress';
import axios from 'axios';
import fs from 'fs/promises';
import batchPromises from 'batch-promises';
import { config } from 'dotenv';
import rateLimit from 'axios-rate-limit';

// Set your dotenv config to the root directory where the .env file lives
config({ path: '../../.env' });

// Extract PAT and Workspace from .env
const { PERSONAL_ACCESS_TOKEN } = process.env;

// Edit these options to your preferences
// Update the "formats" array accordingly to the formats you want to include in download.
// Supported formats include SVG, PNG, JPEG, PDF, and WebP.
const PROJECT_OPTIONS = {
  dir: 'Output',
  projectId: '62cdd21c6431a9117056d259',
  formats: ['svg', 'png', 'jpg', 'webp', 'pdf'],
};

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

const getAssetData = async (screen) => {
  const { id, name } = screen;
  const { data } = await zeplinClient.screens
    .getLatestScreenVersion(PROJECT_OPTIONS.projectId, id);
  return data.assets.flatMap(({ displayName, contents }) => {
    // remove any asset that are not in the formats defined in PROJECT_OPTIONS.formats
    const filteredContents = contents.filter((content) => (
      PROJECT_OPTIONS.formats.includes(content.format)
    ));
    return filteredContents.map(({ url, format, density }) => ({
      name,
      url,
      filename: `${displayName.replaceAll('/', '-')}-${density}x.${format}`,
    }));
  });
};

const downloadAsset = async ({ name, url, filename }, progress) => {
  const { dir } = PROJECT_OPTIONS;
  try {
    const { data } = await axios.get(url, { responseType: 'stream' });
    await fs.mkdir(`${dir}/${name}`, { recursive: true });
    await fs.writeFile(`${dir}/${name}/${filename}`, data);
  } catch (err) {
    console.log(`Error downloading ${name}`);
    console.log(err);
  }
  progress.tick();
};

const main = async () => {
  const projectScreens = await getProjectScreens(PROJECT_OPTIONS.projectId);

  const assets = (await Promise.all(projectScreens.map(
    async (screen) => getAssetData(screen),
  ))).flat();

  const assetsBar = new Progress('  Downloading project assets [:bar] :rate/bps :percent :etas', {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: assets.length,
  });

  // Remove existing Output folder and create new one at start of script
  await fs.rm(PROJECT_OPTIONS.dir, { recursive: true, force: true });
  await fs.mkdir(PROJECT_OPTIONS.dir);

  await batchPromises(10, assets, (asset) => downloadAsset(asset, assetsBar));
};

await main();
