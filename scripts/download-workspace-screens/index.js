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

// Instantiate ZeplinClient with access token
const zeplinClient = new ZeplinApi(new Configuration({ accessToken: PERSONAL_ACCESS_TOKEN }));

// First get all projects in your workspace
const getAllProjects = async () => {
  const projects = [];
  let data;
  let i = 0;
  do {
    // Must access this endpoint with await
    // eslint-disable-next-line no-await-in-loop
    ({ data } = await zeplinClient.organizations.getOrganizationProjects(WORKSPACE_ID, {
      offset: i * 100,
      limit: 100,
    }));
    projects.push(...data);
    i += 1;
  } while (data.length === 100);
  return projects;
};

// Get screen data. Screens do not include project names in their response,
// so add the data for referencing the save directory later
const getProjectScreens = async (project, progress) => {
  const { name: projectName } = project;
  const screens = [];
  let data;
  let i = 0;
  do {
    // Must access this endpoint with await
    // eslint-disable-next-line no-await-in-loop
    ({ data } = await zeplinClient.screens.getProjectScreens(
      project.id,
      { offset: i * 100, limit: 100 },
    ));
    const modifiedDataWithProjectName = data.map((screen) => ({
      projectName,
      ...screen,
    }));
    screens.push(...modifiedDataWithProjectName);
    i += 1;
  } while (data.length === 100);
  progress.tick();
  return screens;
};

// Zeplin API rate limit is 200 requests per user per minute.
// Use rateLimit to extend Axios to only make 200 requests per minute (60,000ms)
const http = rateLimit(axios.create(), { maxRequests: 200, perMilliseconds: 60000 });

const downloadScreen = async (screen, progress) => {
  const { name, image: { originalUrl }, projectName } = screen;
  const { data } = await http.get(originalUrl, { responseType: 'stream' });

  await fs.mkdir(`${dir}/${projectName}`, { recursive: true });
  await fs.writeFile(`${dir}/${projectName}/${name}.png`, data);

  progress.tick();
};

const main = async () => {
  const projects = await getAllProjects();

  console.log(`There are ${projects.length} projects`);

  const projectsBar = new Progress('  Fetching screens [:bar] :rate/bps :percent :etas', {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: projects.length,
  });

  const screens = (await Promise.all(projects.map(
    async (project) => getProjectScreens(project, projectsBar),
  ))).flat();

  console.log(`There are ${screens.length} screens`);

  const screensBar = new Progress('  Fetching screens [:bar] :rate/bps :percent :etas', {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: screens.length,
  });

  // Remove existing Output folder and create new one at start of script
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir);

  await batchPromises(10, screens, (screen) => downloadScreen(screen, screensBar));
};

await main();
