# Zeplin Community: Get Member Projects

This command line tool utilizes the [Zeplin Node SDK](https://github.com/zeplin/javascript-sdk) to get a list of members in a workspace with a list of projects they have joined with their last seen date.

## Getting Started

1. Create a Personal Access Token from the Zeplin web app under [Developer](https://app.zeplin.io/profile/developer) tab in your profile page. When creating your token, enable the checkbox for admin access, or Zeplin will obfuscate any user email addresses.

2. Create a .env file to enter your Personal Access token. Refer to the file `.env.example` for environment variable naming. You'll also add your Workspace ID here, which can be found by going to your Workspace and copying it from the url:
```https://app.zeplin.io/workspace/WORKSPACE_ID/projects```

## Usage

Run the script from the command line:

```console
$ node get-member-projects
```