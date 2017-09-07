import axios from 'axios';
import atob from 'atob';
import { POPULAR_DEPENDENCIES } from '../data/popularDependencies.js';
import { POPULAR_TOPICS } from '../data/popularTopics.js';
import { handleAxiosReject, identifyDependencies, identifyReadMeTopics } from '../utils.js';

exports.verifyRepoExists = function(namespace, repo, CLIENT_ID, CLIENT_SECRET) {
	return axios.get(`https://api.github.com/repos/${namespace}/${repo}?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`)
}

exports.getRepoInfo = function(namespace, repo, CLIENT_ID, CLIENT_SECRET) {
	return axios.all([
	                 getDependencies(namespace, repo, CLIENT_ID, CLIENT_SECRET), 
	                 getLanguages(namespace, repo, CLIENT_ID, CLIENT_SECRET), 
	                 getTopics(namespace, repo, CLIENT_ID, CLIENT_SECRET), 
	                 getReadMeTopics(namespace, repo, CLIENT_ID, CLIENT_SECRET),
	                 getRateLimit(CLIENT_ID, CLIENT_SECRET)
	                 ])
		.then(([dependencies, languages, topics, readMeTopics, rateLimit]) => {

			// group all repo info into one object and return it
			return {
				dependencies,
				languages,
				topics,
				readMeTopics,
				rateLimit
			};			
		}, handleAxiosReject)
}


function getDependencies(namespace, repo, CLIENT_ID, CLIENT_SECRET) {
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
					const TECH_SET = new Set(POPULAR_DEPENDENCIES);

					return identifyDependencies(allRes, TECH_SET);
				}, handleAxiosReject)
		}, handleAxiosReject)
}

// get languages
function getLanguages(namespace, repo, CLIENT_ID, CLIENT_SECRET) {
	return axios.get(`https://api.github.com/repos/${namespace}/${repo}/languages?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`)
		.then((res) => {
			return Object.keys(res.data);
		}, handleAxiosReject)
}


// get topics
// this API route is still a preview feature
// it requires a special accept header
// and may change or break unexpectedly
function getTopics(namespace, repo, CLIENT_ID, CLIENT_SECRET) {
	return axios.get(
		`https://api.github.com/repos/${namespace}/${repo}/topics?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`,
		{headers: {'Accept': 'application/vnd.github.mercy-preview+json'}}
	)
		.then((res) => {
			return res.data.names;
		}, handleAxiosReject)
}

function getReadMeTopics(namespace, repo, CLIENT_ID, CLIENT_SECRET) {
	// get readme to analyze for topics using popular topics
	return axios.get(`https://api.github.com/repos/${namespace}/${repo}/readme?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`)
		.then((res) => {
			return identifyReadMeTopics(res.data.content, POPULAR_TOPICS);
		}, handleAxiosReject)
}

// get rate limit
function getRateLimit(CLIENT_ID, CLIENT_SECRET) {
	return axios.get(`https://api.github.com/rate_limit?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`)
		.then((res) => {
			return res.data.rate;
		}, handleAxiosReject)
}