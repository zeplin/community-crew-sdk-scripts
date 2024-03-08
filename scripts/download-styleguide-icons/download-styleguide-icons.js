import { ZeplinApi, Configuration } from '@zeplin/sdk';
import Progress from 'progress';
import axios from 'axios';
import fs from 'fs/promises';
import { config } from 'dotenv';
import rateLimit from 'axios-rate-limit';
import { Command } from 'commander';
import pLimit from 'p-limit';

// Set your dotenv config to the root directory where the .env file lives
config({ path: '../../.env' });

// Extract PAT and Workspace from .env
const { PERSONAL_ACCESS_TOKEN } = process.env;

// use Commander to take in options from the command line
const program = new Command();

// Zeplin API rate limit is 200 requests per user per minute.
// Use rateLimit to extend Axios to only make 200 requests per minute (60,000ms)
const http = rateLimit(axios.create(), { maxRequests: 200, perMilliseconds: 60000 });

// Instantiate zeplin with access token, adding our rate limited http client

const zeplin = new ZeplinApi(
  new Configuration(
    { accessToken: PERSONAL_ACCESS_TOKEN },
  ),
  undefined,
  http,
);

// Get all styleguide components while handling pagination

const getStyleguideComponents = async (
  styleguideId,
  {
    offset = 0, limit = 30, includeLatestVersion = true, formats, identifier, density,
  },
) => {
  let allData = [];
  let hasMoreData = true;
  // Handle pagination
  while (hasMoreData) {
    const { data } = await zeplin.components.getStyleguideComponents(
      styleguideId,
      { offset, limit, includeLatestVersion },
    );

    if (data.length === 0) {
      hasMoreData = false; // No more data, exit loop
    } else {
      allData = allData.concat(data);
      offset += limit; // Update offset for next page
    }
  }

  // Remove any components that don't include the identifier in naming convention
  const filteredDataByName = allData.filter((item) => item.name.startsWith(identifier));

  return filteredDataByName.reduce((acc, item) => {
    const latestVersion = item.latestVersion || {};
    const assets = latestVersion.assets || [];

    // density array returns string types when command is run. Convert to numbers.
    const parsedDensities = density.map((str) => Number(str));

    assets.forEach((asset) => {
      const { layerName } = asset;
      const contents = asset.contents || [];
      contents.forEach((content) => {
        if (formats.includes(content.format)) {
          if (parsedDensities.includes(content.density)) {
            acc.push({ name: layerName, url: content.url, filename: `${layerName.replaceAll('/', '-')}-${content.density}x.${content.format}` });
          }
        }
      });
    });

    return acc;
  }, []);
};

const downloadAsset = async ({ name, url, filename }, dir, progress) => {
  try {
    const { data } = await axios.get(url, { responseType: 'stream' });

    // Create a new directory called "Icons" and a new nested directory for each icon.
    // This keeps icons with different densities organized together in the same folder.
    await fs.mkdir(`${dir}/${name}`, { recursive: true });

    // Remove the "dir" and "name" folders if you want all of your icons in a single folder
    await fs.writeFile(`${dir}/${name}/${filename}`, data);
  } catch (err) {
    console.log(`Error downloading ${name}`);
    console.log(err.config.url);
  }
  progress.tick();
};

// add command line options
program
  .requiredOption('-s, --styleguideId <styleguideId>', 'Styleguide ID')
  .option('-i, --identifier <identifier>', 'Identifier for filtering icon naming convention', '')
  .option('-f, --formats <formats...>', 'Formats to download', ['png', 'jpg', 'webp', 'svg', 'pdf'])
  .option('-d, --density <density...>', 'Asset density to download', [1, 2, 3])
  .action(async ({
    styleguideId, formats, identifier, density,
  }) => {
    const components = await getStyleguideComponents(
      styleguideId,
      { formats, identifier, density },
    );
    console.log(density);
    const assetsBar = new Progress('  Downloading styleguide icons [:bar] :rate/bps :percent :etas', {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total: components.length,
    });

    // Remove existing icons folder and create new one at start of script
    await fs.rm('icons', { recursive: true, force: true });
    await fs.mkdir('icons');

    const limit = pLimit(20);

    const downloadComponents = components.map((asset) => (
      limit(() => downloadAsset(asset, 'icons', assetsBar))));

    await Promise.all(downloadComponents);
    console.log(components);
    return components;
  });

program.parse(process.argv);
