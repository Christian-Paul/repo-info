import express from 'express';
const app = express();
const PORT = 8000;

app.get('/', function(req, res) {
	res.send('hello');
});

app.listen(PORT, () => {
	console.log('listening on port: ', PORT)
});