import express from 'express';
const app = express();

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
	console.log('listening on port: ', PORT)
});

app.use(express.static('./public'));
app.use(require('./controllers'));