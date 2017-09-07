import http from 'http';
import { assert } from 'chai';

import '../lib/server.js';

describe('Express Server', () => {
	it('should return 200', done => {
		http.get('http://127.0.0.1:8000', res => {
			assert.equal(200, res.statusCode);
			done();
		})
	})
});

describe('Repo Info API', () => {
	it('should return 400 for an invalid repo namespace', done => {
		http.get('http://127.0.0.1:8000/api/Christian_Paul/test-repo', res => {
			assert.equal(400, res.statusCode);
			done();
		})
	})

	it('should return 400 for an invalid repo name', done => {
		http.get('http://127.0.0.1:8000/api/Christian-Paul/test$repo', res => {
			assert.equal(400, res.statusCode);
			done();
		})
	})

	it('should return 404 for a valid repo that does not exist', done => {
		http.get('http://127.0.0.1:8000/api/Christian-Paul/tested-repo', res => {
			assert.equal(404, res.statusCode);
			done();
		})
	})

	it('should return appropriate headers for sample repo', done => {
		http.get('http://127.0.0.1:8000/api/Christian-Paul/test-repo', res => {
			assert.equal(200, res.statusCode, 'Should return status code 200');
			assert.equal(/^application\/json/.test(res.headers['content-type']), true, 'Should return application/json as content-type');
			done();
		})
	})

	it('sample repo should return appropriate data', done => {
		http.get('http://127.0.0.1:8000/api/Christian-Paul/test-repo', res => {
			let rawData = '';

			res.on('data', (chunk) => {
				rawData += chunk;
			})

			res.on('end', () => {
				const parsedData = JSON.parse(rawData);

				// verify presense of each response field
				assert.equal(parsedData.hasOwnProperty('dependencies'), true, 'Response should have dependencies property');
				assert.equal(parsedData.hasOwnProperty('languages'), true, 'Response should have languages property');
				assert.equal(parsedData.hasOwnProperty('topics'), true, 'Response should have topics property');
				assert.equal(parsedData.hasOwnProperty('readMeTopics'), true, 'Response should have readMeTopics property');
				assert.equal(parsedData.hasOwnProperty('rateLimit'), true, 'Response should have rateLimit property');

				// check if the returned data matches correct data
				const correctDependencies = ['axios', 'express', 'babel-preset-es2015', 'mocha', 'nodemon'];
				const correctLanguages = ['JavaScript'];
				const correctTopics = ['testing', 'open-source', 'collaboration'];
				const correctReadMeTopics = ['github', 'test']; 

				assert.sameMembers(parsedData.dependencies, correctDependencies, 'Dependencies should match');
				assert.sameMembers(parsedData.languages, correctLanguages, 'Languages should match');
				assert.sameMembers(parsedData.topics, correctTopics, 'Topics should match');
				assert.sameMembers(parsedData.readMeTopics, correctReadMeTopics, 'ReadMeTopics should match');

				done();
			})
		})
	})
});