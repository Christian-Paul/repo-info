import atob from 'atob';

// taken from axios documentation
exports.handleAxiosReject = function(error) {
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


// search all package.json files to identify dependencies
exports.identifyDependencies = function(allRes, TECH_SET) {
	let detectedTech = new Set();

	allRes.forEach((res) => {
		// decrypt content and extract dependencies
		const { dependencies, devDependencies } = JSON.parse(atob(res.data.content));

		// iterate through dependencies and save the ones that
		// appear in popular dependencies set
		for (let dependency in dependencies) {
			if(TECH_SET.has(dependency)) {
				detectedTech.add(dependency);
			};
		}

		for (let devDependency in devDependencies){
			if(TECH_SET.has(devDependency)) {
				detectedTech.add(devDependency);
			};
		}
	});
	return [...detectedTech];
}

// iterate through popular topics and add any topics that
// appear in readMe to detectedTopics set
exports.identifyReadMeTopics = function(rawReadMe, POPULAR_TOPICS) {
	const readMe = atob(rawReadMe);
	let detectedTopics = new Set();

	POPULAR_TOPICS.forEach((topic) => {
		let re = new RegExp(`(:?\\W${topic.topic}\\W)`);
		if(re.test(readMe)) {
			detectedTopics.add(topic.topic);
		}
	})

	return [...detectedTopics];
}