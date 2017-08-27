import express from 'express';
const app = express();
import axios from 'axios';
import atob from 'atob';
import { POPULAR_DEPENDENCIES } from './popularDependencies.js';
import { POPULAR_TOPICS } from './popularTopics.js';


const PORT = process.env.PORT || 8000;
let config;

if(process.env.NODE_ENV === 'production') {
	config = { 
		CLIENT_ID: process.env.CLIENT_ID, 
		CLIENT_SECRET: process.env.CLIENT_SECRET
	}
} else {
	config = require('./config.js');
}

const { CLIENT_ID, CLIENT_SECRET } = config;

app.use(express.static('./public'));

app.get('/api/:namespace/:repo', function(req, res) {
	const [namespace, repo] = [req.params.namespace, req.params.repo];

	// check if username is valid
	const GITHUB_NAMESPACE_REGEX = new RegExp(/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){1,38}$/i);
	if(!GITHUB_NAMESPACE_REGEX.test(namespace)) {
		res.status(400).send('Invalid GitHub Namespace');
		return;
	}

	// check if repo name is valid
	const GITHUB_REPONAME_REGEX = new RegExp(/([^A-Z0-9._-])/i);
	if(GITHUB_REPONAME_REGEX.test(repo)) {
		res.status(400).send('Invalid GitHub Repo Name');
		return;
	}

	// check if repo exists
	axios.get(`https://api.github.com/repos/${namespace}/${repo}?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`)
		.then((data) => {
			// proceed to obtain data if test query returned data
			getRepoInfo(namespace, repo)
				.then((repoInfo) => {
					res.json(repoInfo);
				}, (err) => {
					// default error message
					res.status(500).send('Something went wrong')
				})
		}, (err) => {
			// if repo was not found, return error message
			res.status(404).send('Repo not found');
		})
});

app.listen(PORT, () => {
	console.log('listening on port: ', PORT)
});

function getRepoInfo(namespace, repo) {
	return axios.all([getDependencies(namespace, repo), getLanguages(namespace, repo), getTopics(namespace, repo), getReadMeTopics(namespace, repo)])
		.then(([dependencies, languages, topics, readMeTopics]) => {
			let repoInfo = {
				dependencies,
				languages,
				topics,
				readMeTopics
			}

			return repoInfo;
		}, handleAxiosReject)
}


function getDependencies(namespace, repo) {
	// find all package.json files to request
	return axios.get(`https://api.github.com/repos/${namespace}/${repo}/git/trees/heads/master?recursive=1&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`)
		.then((tree) => {
			let packagePaths = [];

			tree.data.tree.forEach((item) => {
				if(item.path.indexOf('package.json') !== -1) {
					packagePaths.push(item.path);
				}
			});

			// request each package.json file
			 return axios.all(packagePaths.map((path) => {
				return axios.get(`https://api.github.com/repos/${namespace}/${repo}/contents/${path}?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`)
			}))
				.then((allRes) => {
					// create set from popular dependency array
					const techSet = new Set(POPULAR_DEPENDENCIES);
					let detectedTech = new Set();

					// search each package file for dependencies
					allRes.forEach((res) => {
						// decrypt content and extract dependencies
						const { dependencies, devDependencies } = JSON.parse(atob(res.data.content));

						// iterate through dependencies and save the ones that
						// appear in popular dependencies set
						for (let dependency in dependencies) {
							if(techSet.has(dependency)) {
								detectedTech.add(dependency);
							};
						}

						for (let devDependency in devDependencies){
							if(techSet.has(devDependency)) {
								detectedTech.add(devDependency);
							};
						}
					});

					return [...detectedTech];
				}, handleAxiosReject)
		}, handleAxiosReject)
}

// get languages
function getLanguages(namespace, repo) {
	return axios.get(`https://api.github.com/repos/${namespace}/${repo}/languages?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`)
		.then((res) => {
			return Object.keys(res.data);
		}, handleAxiosReject)
}


// get topics
// this API route is still a preview feature
// it requires a special accept header
// and may change or break unexpectedly
function getTopics(namespace, repo) {
	return axios.get(
		`https://api.github.com/repos/${namespace}/${repo}/topics?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`,
		{headers: {'Accept': 'application/vnd.github.mercy-preview+json'}}
	)
		.then((res) => {
			return res.data.names;
		}, handleAxiosReject)
}

function getReadMeTopics(namespace, repo) {
	// get readme to analyze for topics using popular topics
	return axios.get(`https://api.github.com/repos/${namespace}/${repo}/readme?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`)
		.then((res) => {
			const readMe = atob(res.data.content);

			// iterate through popular topics and add any topics that
			// appear in readMe to detectedTopics set
			let detectedTopics = new Set();
			POPULAR_TOPICS.forEach((topic) => {
				let re = new RegExp(`(:?\\W${topic.topic}\\W)`);
				if(re.test(readMe)) {
					detectedTopics.add(topic.topic);
				}
			})
			return [...detectedTopics];
		}, handleAxiosReject)
}

// taken from axios documentation
function handleAxiosReject(error) {
	// in dev, log errors
	if(process.env.NODE_ENV !== 'production') {
		if (error.response) {
			console.log(error.response.data);
			console.log(error.response.status);
			console.log(error.response.headers);
		} else if (error.request) {
			console.log(error.request);
		} else {
			console.log('Error', error.message);
		}
		console.log(error.config);
	}
};