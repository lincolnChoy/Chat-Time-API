const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const knex = require('knex');
const bodyParser = require('body-parser');
const cors = require('cors');

const signIn = require('./controllers/signIn');
const register = require('./controllers/register');
const users = require('./controllers/users');
const profiles = require('./controllers/profiles');

/* Set up database using knex module */
const db = knex({
	client : 'pg',
	connection : {
		host : '127.0.0.1',
		user : 'postgres',
		password : '',
		database : 'chat_time',
	}	
});

const app = express();
app.use(cors());

/* Body parser to parse json */
app.use(bodyParser.json());


/* API routes */
app.get('/', (req,res) => { res.send('Server is up'); });

app.post('/register', (req,res) => { register.handleRegister(req, res, db, bcrypt) });

app.post('/signIn', (req,res) => { signIn.handleSignIn(req, res, db, bcrypt) });

app.post('/getList', (req,res) => { users.handleGetList(req, res, db, bcrypt)});

app.get('/getProfile', (req, res) => { profiles.handleGetProfile(req, res, db, bcrypt)});

app.post('/saveProfile', (req,res) => { profiles.handleSaveProfile(req, res, db, bcrypt)});


app.listen(process.env.PORT || 3000, () => {
	console.log('Server started');
});