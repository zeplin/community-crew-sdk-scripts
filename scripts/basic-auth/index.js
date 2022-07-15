import { ZeplinApi, Configuration } from '@zeplin/sdk';
import { config } from 'dotenv';

// Set your dotenv config to the root directory where the .env file lives
config({ path: '../../.env' });

// Extract PAT and Workspace from .env
const { PERSONAL_ACCESS_TOKEN, WORKSPACE_ID } = process.env;

// Instantiate Zeplin SDK with access token
const zeplin = new ZeplinApi(new Configuration({ accessToken: PERSONAL_ACCESS_TOKEN }));

// EXAMPLES

// Print a list of project names
const logProjectNames = async () => {
  const projects = await zeplin.organizations.getOrganizationProjects(WORKSPACE_ID);
  console.log(projects.data.map((project) => project.name));
};

// Get Workspace Members

const getWorkspaceMemberEmails = async () => {
  const members = await zeplin.organizations.getOrganizationMembers(WORKSPACE_ID);

  console.log(members.data.map((user) => user.user.email));
};

const main = async () => {
  await logProjectNames();
  await getWorkspaceMemberEmails();
};

await main();
