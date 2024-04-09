import { ZeplinApi, Configuration } from '@zeplin/sdk';
import axios from 'axios';
import fs from 'fs/promises';
import { config } from 'dotenv';
import rateLimit from 'axios-rate-limit';
import { Command } from 'commander';
import { json2csv } from 'json-2-csv';
import pLimit from 'p-limit';

// Set your dotenv config to the root directory where the .env file lives
config({ path: '../../.env' });

// Extract PAT and Workspace from .env
const { PERSONAL_ACCESS_TOKEN } = process.env;

// use Commander to take in options from the command line
const program = new Command();

// Zeplin API rate limit is 200 requests per user per minute.
// Use rateLimit to extend Axios to only make 200 requests per minute (60,000ms)
const http = rateLimit(axios.create(), { maxRequests: 180, perMilliseconds: 60000 });

// Instantiate zeplin with access token, add our http client to the zeplin
const zeplin = new ZeplinApi(
  new Configuration({ accessToken: PERSONAL_ACCESS_TOKEN }),
  undefined,
  http,
);

// Get all project screens while handling pagination
const getProjectScreens = async (projectId, { offset = 0, limit = 15 } = {}) => {
  let hasMoreData = true;

  const fetchData = async (pageOffset) => {
    const { data } = await zeplin.screens.getProjectScreens(projectId, { offset: pageOffset, limit });
    return data;
  };

  const fetchAllPages = async () => {
    const result = [];

    while (hasMoreData) {
      const data = await fetchData(offset);
      result.push(data);
      offset += limit;

      // Update hasMoreData based on whether data was fetched
      if (data.length === 0) {
        hasMoreData = false;
      }
    }

    return result;
  };

  const pagesData = await fetchAllPages();
  // Flatten the array of arrays to a single array and filter out screens without notes
  const allScreens = pagesData.flat();
  const screensWithNotes = allScreens.filter((screen) => screen.numberOfNotes > 0);
  const totalNumberOfNotes = allScreens.reduce((total, item) => total + item.numberOfNotes, 0);
  console.log(`${allScreens.length} screens scanned. ${totalNumberOfNotes} notes found in ${screensWithNotes.length} screens`);
  return screensWithNotes;
};

const getProjectName = async (projectId) => {
  const { data: { name } } = await zeplin.projects.getProject(projectId);
  return name;
};

const getSingleScreenNotes = async (screen, projectId, projectName) => {
  const { id, name: screenName } = screen;
  const { data } = await zeplin.screens.getScreenNotes(projectId, id);

  // format the data for the CSV
  const parsedData = data.map((note) => {
    const flattenedComments = {};
    // the first comment at index 0 is the original note. Start at index 1.
    let index = 1;

    while (index < note.comments.length) {
      const comment = note.comments[index];
      const commentDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(new Date(comment.updated * 1000));
      const commentIndex = index > 0 ? index : '';
      flattenedComments[`comment ${commentIndex} author`] = comment.author.username;
      flattenedComments[`comment ${index} text`] = comment.content;
      flattenedComments[`comment ${index} updated`] = commentDate;
      index++;
    }

    const link = `https://app.zeplin.io/project/${projectId}/screen/${id}`;

    return {
      project: projectName,
      screen: screenName,
      url: link,
      status: note.status,
      date: new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(new Date(note.created * 1000)),
      'note author': note.creator.username,
      'note text': note.comments.length > 0 ? note.comments[0].content : '',
      ...flattenedComments,
    };
  });

  return parsedData;
};

const writeCsvToFile = async (csv, projectName) => {
  try {
    // Write the CSV data to a file named '${projectName} - notes.csv'
    await fs.writeFile(`${projectName} - notes.csv`, csv);
    console.log(`CSV data has been written to ${projectName} - notes.csv`);
  } catch (error) {
    console.error('Error occurred while writing to file:', error);
    throw error; // Re-throw the error for handling by the caller if needed
  }
};

// add command line options
program
  .requiredOption('-p, --projectId <projectId>', 'Project ID')
  .action(async ({ projectId }) => {
    const projectScreens = await getProjectScreens(projectId);
    const projectName = await getProjectName(projectId);
    const limit = pLimit(10);

    const notes = (await Promise.all(projectScreens.map(
      async (screen) => limit(() => getSingleScreenNotes(screen, projectId, projectName)),
    ))).flat();

    // Get field names from the object keys for the annotation object we have created
    const fields = Object.keys(notes[0]);

    // Format the JSON data to CSV
    const csv = json2csv(notes, { fields });

    // Write the CSV data to a new file
    writeCsvToFile(csv, projectName)
      .then(() => console.log('File writing completed successfully.'))
      .catch((error) => console.error('File writing failed:', error));
  });

program.parse(process.argv);
