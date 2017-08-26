import express from 'express';
const app = express();
import axios from 'axios';
import atob from 'atob';
import { POPULAR_DEPENDENCIES } from './popularDependencies.js';
import { POPULAR_TOPICS } from './popularTopics.js';


const PORT = 8000 || process.env.PORT;

if(PORT === 8000) {
	const { CLIENT_ID, CLIENT_SECRET } = require('./config.js');
} else {
	const { CLIENT_ID, CLIENT_SECRET } = process.env;
}

app.use(express.static('./public'));

app.get('/hi', function(req, res) {
	res.send('hi');
});

app.get('/api/:namespace/:repo', function(req, res) {
	console.log('params: ', req.params);

	axios.all([getDependencies(), getLanguages(), getTopics(), getReadMeTopics()])
		.then((data) => {
			let repoInfo = {
				dependencies: data[0],
				languages: data[1],
				topics: data[2],
				readmeTopics: data[3]
			}
			console.log('data: ', repoInfo);
			res.json(repoInfo);
		}, handleAxiosReject)
});

app.listen(PORT, () => {
	console.log('listening on port: ', PORT)
});

const [ namespace, repo ] = [ 'Christian-Paul', 'repo-info' ];

function getDependencies() {
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
function getLanguages() {
	return axios.get(`https://api.github.com/repos/${namespace}/${repo}/languages?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`)
		.then((res) => {
			return Object.keys(res.data);
		}, handleAxiosReject)
}


// get topics
// this API route is still a preview feature
// it requires a special accept header
// and may change or break unexpectedly
function getTopics() {
	return axios.get(
		`https://api.github.com/repos/${namespace}/${repo}/topics?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`,
		{headers: {'Accept': 'application/vnd.github.mercy-preview+json'}}
	)
		.then((res) => {
			return res.data.names;
		}, handleAxiosReject)
}

function getReadMeTopics() {
	// get readme to analyze for topics using popular topics
	return axios.get(`https://api.github.com/repos/${namespace}/${repo}/readme?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`)
		.then((res) => {
			const readMe = atob(res.data.content);

			// iterate through popular topics and add any topics that
			// appear in readMe to detectedTopics set
			let detectedTopics = new Set();
			POPULAR_TOPICS.forEach((topic) => {
				if(readMe.indexOf(topic.topic) !== -1) {
					detectedTopics.add(topic.topic);
				}
			})
			return [...detectedTopics];
		}, handleAxiosReject)
}

// taken from axios documentation
function handleAxiosReject(error) {
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
};