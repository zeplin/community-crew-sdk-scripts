# Zeplin Community: Download all styleguide icons

This command line tool utilizes the [Zeplin Node SDK](https://github.com/zeplin/javascript-sdk) download all icons in a styleguide. The script relies on your design system's naming convention for icon, assuming that you have a naming convention with a prefix for your icons, e.g. `ico_back-arrow` or `icons/in-app icon / cart`. Specify the naming convention with the flag `-i <identifier>`. e.g: `-i ico` will download assets that start with the letters 'ico' in their name.


Zeplin supports SVG, PNG, PDF, JPG, and WEBP image formats depending on your project type. All formats will by download by default, but you can specify which formats you want downloaded in the command line options with the flag `-f <formats>`. 

Density 1x, 2x, and 3x will be downloaded by default for formats that support multiple densities. You can specify density with the flag `-d 1 2` for example, which downloads only 1x and 2x densities.



More examples below. 

## Getting Started

1. Create a Personal Access Token from the Zeplin web app under [Developer](https://app.zeplin.io/profile/developer) tab in your profile page.

2. Create a .env file to enter your Personal Access token. Refer to the file `.env.example` for environment variable naming. You'll also add your Workspace ID here, which can be found by going to your Workspace and copying it from the url:
```https://app.zeplin.io/workspace/WORKSPACE_ID/projects```

## Usage
Get your Zeplin Styleguide ID from the Web app, for example `https://app.zeplin.io/styleguide/12345`

```console
$ cd scripts/download-styleguide-icons
$ node download-styleguide-icons -s <stylguideId> -i <identifier>
```

## Options
Use the `--help` flag for more information on the options for the command line

```console
$ node download-project-assets --help
Usage: download-project-assets [options]

Options:
  -p, --s <styleguideId>  Styleguide ID
  -i, --identifier <identifer> Identifier for filtering icon naming convention
  -f, --formats <formats...>   Formats to download (default:
                               ["png","jpg","webp","svg","pdf"])
  -d, --density <density...>   Densities to download (default: [1,2,3])                          
  -h, --help                   display help for command
```

## Example

Download only SVG and PNG assets from styleguide 123456 for components that begin with 'ico' into new 'Icons' directory in local folder, with 1x and 2x densities:

```console
$ node download-styleguide icons -s 123456 -f svg png -d 1 2 -i 'ico'
```