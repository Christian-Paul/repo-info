# Purpose
This API is used to gather information about GitHub Repos: it leverages the GitHub API to gather Languages, Dependencies, Topics, and ReadMes. This project was created to provide repo data to [FCC Alumni Network](https://github.com/FCC-Alumni/alumni-network), which FCC graduates can use to find projects to collaborate on.

# Usage
`https://repo-info.herokuapp.com/api/{repo-owner}/{repo-name}`

For example, requesting info about this repo would look like:

`https://repo-info.herokuapp.com/api/Christian-Paul/repo-info`

```
{
	"dependencies": [
		"axios",
		"express",
		"mocha",
		...
	],
	"languages": [
		"JavaScript",
		"HTML",
		...
	],
	"topics": [
		"api",
		...
	],
	"readMeTopics": [
		"api",
		"github",
		...
	]
}
```

# How it Works
Dependency data is obtained from the GitHub API and is then filtered based on a list of popular dependencies. The list of popular dependencies was obtained [here](https://gist.github.com/anvaka/8e8fa57c7ee1350e3491#top-1000-most-depended-upon-packages) and was trimmed down to eliminate redundancies.

ReadMeTopics are obtained by getting ReadMe text from the GitHub API, then detecting the presence of popular topic names, which was obtained [here](http://www.gitlogs.com/awesome-topics). This field detects technical and non-technical information that users may not have added to the repo's official topics, which was a new feature when this API was created.

The language and topic data is obtained directly from the GitHub API and is not returned as is.