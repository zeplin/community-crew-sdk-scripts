# Zeplin Community: Download all project assets

This command line tool utilizes the [Zeplin Node SDK](https://github.com/zeplin/javascript-sdk) download all assets in a project, creating a new directory for each screen in your project. Zeplin supports SVG, PNG, PDF, JPG, and WEBP image formats depending on your project type. All formats will by download by default, but you can specify which formats you want downloaded in the command line options with `-f <formats>`. More examples below.

## Getting Started

1. Create a Personal Access Token from the Zeplin web app under [Developer](https://app.zeplin.io/profile/developer) tab in your profile page.

2. Create a .env file to enter your Personal Access token. Refer to the file `.env.example` for environment variable naming. You'll also add your Workspace ID here, which can be found by going to your Workspace and copying it from the url:
```https://app.zeplin.io/workspace/WORKSPACE_ID/projects```

## Usage
Get your Zeplin Project ID from the Web app, for example `https://app.zeplin.io/project/12345`

```console
$ cd scripts/download-assets
$ node download-project-assets -projectId <project id> -directory <output directory>
```

## Options
Use the `--help` flag for more information on the options for the command line

```console
$ node download-project-assets --help
Usage: download-project-assets [options]

Options:
  -p, --projectId <projectId>  Project ID
  -d, --directory <dir>        Output directory
  -f, --formats <formats...>   Formats to download (default:
                               ["png","jpg","webp","svg","pdf"])
  -h, --help                   display help for command
```

## Examples

Download all asset formats from project 12345 into the "Assets" directory
```console
$ node download-project-assets --projectId 12345 --directory Assets
```

Download only SVG and PNG assets from project 12345 into the "Output" directory

```console
$ node download-project-assets -p 12345 -d Output -f svg png
```