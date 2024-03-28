# Zeplin Community: Download Project Annotations

This command line tool utilizes the [Zeplin Node SDK](https://github.com/zeplin/javascript-sdk) to download all annotations in your project to CSV file. For each Annotation, the CSV will capture the following data:

* Project Name
* Screen Name
* Annotation author
* Date
* Annotation Type (Behavior, API, Requirement, Accessibility, Animation, API, Tracking, or None)
* Annotation text

## Getting Started

1. Create a Personal Access Token from the Zeplin web app under [Developer](https://app.zeplin.io/profile/developer) tab in your profile page.

2. Create a .env file to enter your Personal Access token. Refer to the file `.env.example` for environment variable naming.

## Usage
Get your Zeplin Project ID from the Web app, for example `https://app.zeplin.io/project/12345`

In your command line:

```console
$ cd scripts/download-project-annotations
$ node download-project-annotations -projectId <project id>
```

When the script runs, a  file named "annotations.csv" will be created containing all annotations of the project.