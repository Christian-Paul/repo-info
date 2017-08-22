import express from 'express';
const app = express();
const PORT = 8000;

app.use(express.static('./public'));

app.get('/hi', function(req, res) {
	res.send('hi');
});

app.listen(PORT, () => {
	console.log('listening on port: ', PORT)
});