import { ZeplinApi, Configuration } from '@zeplin/sdk';
import { config } from 'dotenv';
import { Command } from 'commander';

// Set your dotenv config to the root directory where the .env file lives
config({ path: '../../.env' });

// Extract PAT and Workspace from .env
const { PERSONAL_ACCESS_TOKEN, WORKSPACE_ID } = process.env;

// use Commander to take in options from the command line
const program = new Command();

// Instantiate zeplin with access token, add our http client to the zeplin
const zeplin = new ZeplinApi(new Configuration({ accessToken: PERSONAL_ACCESS_TOKEN }));

const getWorkspaceMember = async (email) => {
  const { data } = await zeplin.organizations.getOrganizationMembers(
    WORKSPACE_ID,
    email,
  );
  console.log(data[0]);
  return data[0].user.id;
};

const getProjects = async (userId) => {
  const projects = await zeplin.organizations.getOrganizationMemberProjects(
    WORKSPACE_ID,
    userId,
  );
  return projects.data.map((project) => project.name);
};

// add command line options
program
  .requiredOption('-u, --userEmail <userEmail>', 'User Email')
  .action(async ({ userEmail }) => {
    const user = await getWorkspaceMember(userEmail);
    console.log(`getting projects for ${userEmail}: ${user}`);

    const projects = await getProjects(user);

    console.log(projects);
  });

program.parse(process.argv);
