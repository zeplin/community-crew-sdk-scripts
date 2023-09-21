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

const limit = 2; // Define the number of items to fetch per page
let offset = 0; // Initialize the offset to 0

const getWorkspaceMembers = async (offset, limit) => {
  const { data } = await zeplin.organizations.getOrganizationMembers(
    WORKSPACE_ID,
    {
      limit,
      offset,
    },
  );
  return data;
};

const fetchAllWorkspaceMembers = () => {
  let currentPage = 1;
  let allData = []; // Array to store all data
  const fetchPage = () => getWorkspaceMembers(offset, limit)
    .then((data) => {
      // Check if there's no more data to fetch
      if (data.length === 0) {
        return; // Exit the loop if there are no more results
      }
      // Append the data to the allData array
      allData = allData.concat(data);
      // Update the offset for the next page
      offset += limit;
      // Increment the current page
      currentPage += 1;
      // Fetch the next page recursively
      return fetchPage();
    });

  // Start fetching data and return a promise that resolves when done
  return fetchPage().then(() => allData); // Return the accumulated data
};

const getProjects = async (user) => {
  const { data } = await zeplin.organizations.getOrganizationMemberProjects(
    WORKSPACE_ID,
    user.user.id,
  );

  const parsedData = data.map((project) => (
    {
      name: project.name,
      id: project.id,
    }
  ));

  return (
    {
      user: user.user.email,
      lastSeen: user.user.lastSeen,
      projects: parsedData,
    }
  );
};

// add command line options
program
  .action(async () => {
    const users = await fetchAllWorkspaceMembers();
    const userProjects = users.map((user) => getProjects(user));
    const userResults = await Promise.all(userProjects);

    // Combine the results into a single array
    const combinedUserData = userResults.reduce((acc, userData) => {
      acc.push(userData);
      return acc;
    }, []);
    console.log(JSON.stringify(combinedUserData, null, 2));
    return combinedUserData;
  });

program.parse(process.argv);
