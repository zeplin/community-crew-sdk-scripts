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
const { PERSONAL_ACCESS_TOKEN, WORKSPACE_ID } = process.env;

// Directory name for saved screens
const dir = 'Output';
const project = '62be376e04c5d21b2b0faa7d';

// Instantiate ZeplinClient with access token
const zeplinClient = new ZeplinApi(new Configuration({ accessToken: PERSONAL_ACCESS_TOKEN }));

const getProjectScreens = async (projectId) => {
  const screens = await zeplinClient.screens.getProjectScreens(projectId);

  return screens.data.map((screen) => screen.id);
};

const getAssetData = async (screenId) => {
  const assets = [];
  const { data } = await zeplinClient.screens.getLatestScreenVersion(project, screenId);
  data.assets.forEach(asset => {
    const { displayName, contents } = asset;
    contents.forEach(content => {
      const { url, format, density } = content;
      const filename = `${displayName}-${density}x.${format}`;
      assets.push({ url, filename });
    });
  });
  // get url and filename in a useable format
  // contents.forEach((image) => {
  //   const { url, format, density } = image;
  //   const filename = `${displayName}-${density}x.${format}`;
  //   assets.push({
  //     url,
  //     filename,
  //   });
  // });
  return assets;
};

// Zeplin API rate limit is 200 requests per user per minute.
// Use rateLimit to extend Axios to only make 200 requests per minute (60,000ms)
const http = rateLimit(axios.create(), { maxRequests: 200, perMilliseconds: 60000 });

const downloadAsset = async (asset, progress) => {
  const { url, filename } = asset;
  const { data } = await http.get(url, { responseType: 'stream' });

  await fs.mkdir(`${dir}`, { recursive: true });
  await fs.writeFile(`${dir}/${filename}`, data);

  progress.tick();
};

const main = async () => {
  const projectScreens = await getProjectScreens(project);

  const assets = (await Promise.all(projectScreens.map(
    async (screen) => getAssetData(screen),
  ))).flat();
  console.log(`Found ${assets.length} assets`);

  // console.log(assets);
  const assetsBar = new Progress('  Fetching assets [:bar] :rate/bps :percent :etas', {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: assets.length,
  });

  // // Remove existing Output folder and create new one at start of script
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir);

  await batchPromises(10, assets, (asset) => downloadAsset(asset, assetsBar));
};

await main();
