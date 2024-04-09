# Zeplin Community: Download Project Notes

This command line tool utilizes the [Zeplin Node SDK](https://github.com/zeplin/javascript-sdk) to download all notes and comments in your project to CSV file. For each note, the CSV will capture the following data:

* Project Name
* Screen Name
* Note author
* Note status (open/resolved)
* Date
* Note text
* Note comments, comment author, comment date

For all comments, the script will append an additional column in the same row of the note.


## Getting Started

1. Create a Personal Access Token from the Zeplin web app under [Developer](https://app.zeplin.io/profile/developer) tab in your profile page.

2. Create a .env file to enter your Personal Access token. Refer to the file `.env.example` for environment variable naming.

## Usage
Get your Zeplin Project ID from the Web app, for example `https://app.zeplin.io/project/12345`

In your command line:

```console
$ cd scripts/download-project-notes
$ node download-project-notes -projectId <project id>
```

When the script runs, a  file named "[project name] - notes.csv" will be created containing all notes and comments of the project.