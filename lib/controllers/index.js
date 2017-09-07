import express from 'express';
import { verifyRepoExists, getRepoInfo } from '../models/repo.js';
const router = express.Router();


let config;

if(process.env.NODE_ENV === 'production') {
	config = { 
		CLIENT_ID: process.env.CLIENT_ID, 
		CLIENT_SECRET: process.env.CLIENT_SECRET
	}
} else {
	config = require('../config.js');
}

const { CLIENT_ID, CLIENT_SECRET } = config;


router.get('/api/:namespace/:repo', function(req, res) {
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
	verifyRepoExists(namespace, repo, CLIENT_ID, CLIENT_SECRET)
		.then((data) => {
			// proceed to obtain data if test query returned data
			getRepoInfo(namespace, repo, CLIENT_ID, CLIENT_SECRET)
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

module.exports = router;