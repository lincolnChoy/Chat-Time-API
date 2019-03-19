const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const knex = require('knex');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');

const signIn = require('./controllers/signIn');
const register = require('./controllers/register');
const users = require('./controllers/users');
const profiles = require('./controllers/profiles');
const messaging = require('./controllers/messaging');
const group = require('./controllers/group');

dotenv.config();



/* Comment these sections out depending on deployment method */
/* Leave section 1 uncommented for Heroku */
/* Leave section 2 uncommented for local development and change configurations as necessary */

/* Section 1 */
const db = knex({
	client : 'pg',
	connection : {
		connectionString : process.env.DATABASE_URL,
		ssl : true,

	}
});

/* Section 2 */
// const db = knex({
// 	client : 'pg',
// 	connection : {
// 		host : '127.0.0.1',
// 		user : 'postgres',
// 		password : '',
// 		database : 'chat_time',
// 	} 
// });

const app = express();
app.use(cors());

/* Body parser to parse json */
app.use(bodyParser.json({limit: '10mb'}));
app.use(bodyParser.urlencoded({limit: '10mb', extended: true}));


/* API routes */
app.get('/', (req, res) => { res.send('Server is up'); });

app.post('/register', (req, res) => { register.handleRegister(req, res, db, bcrypt) });

app.post('/signIn', (req, res) => { signIn.handleSignIn(req, res, db, bcrypt) });

app.post('/getList', (req, res) => { users.handleGetList(req, res, db, bcrypt)});

app.get('/getProfile', (req, res) => { profiles.handleGetProfile(req, res, db)});

app.post('/saveProfile', (req,res) => { profiles.handleSaveProfile(req, res, db, bcrypt)});

app.post('/sendMessage', (req,res) => { messaging.handleSendMessage(req, res, db, bcrypt)});

app.post('/getMessages', (req,res) => { messaging.handleGetMessages(req, res, db, bcrypt)});

app.post('/createGroup', (req, res) => { group.handleCreateGroup(req, res, db, bcrypt)});


app.listen(process.env.PORT || 3001, () => {
	console.log('Server started');
});

