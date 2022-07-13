# Zeplin Community: Download all workspace screens

This script utilizes the [Zeplin Node SDK](https://github.com/zeplin/javascript-sdk) to download all screen images from all workspace projects, including archived projects. Screen images will not include any technical specs or other layer data, but this script can serve as a way to create a backup reference of your designs. 

## Getting Started

1. Create a Personal Access Token from the Zeplin web app under [Developer](https://app.zeplin.io/profile/developer) tab in your profile page.

2. Create a .env file to enter your Personal Access token. Refer to the file `.env.example` for environment variable naming. You'll also add your Workspace ID here, which can be found by going to your Workspace and copying it from the url:
```https://app.zeplin.io/workspace/WORKSPACE_ID/projects```

## Usage
```sh
$ cd scripts/download-workspace-screens
$ node index.js
```

The script will create a directory for each Zeplin project in the "Output" directory to store the downloaded screens. 
