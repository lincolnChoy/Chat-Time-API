const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const knex = require('knex');
const bodyParser = require('body-parser');
const cors = require('cors');


const signIn = require('./controllers/signIn');
const register = require('./controllers/register');
const users = require('./controllers/users');
const profiles = require('./controllers/profiles');
const messaging = require('./controllers/messaging');



/* Set up database using knex module */
const db = knex({
	client : 'pg',
	connection : {
		connectionString : process.env.DATABASE_URL,
		ssl : true,

	}
});

const app = express();
app.use(cors());

app.use(express.static(__dirname + '/profile_pic/'));

/* Body parser to parse json */
app.use(bodyParser.json({limit: '10mb'}));
app.use(bodyParser.urlencoded({limit: '10mb', extended: true}));


/* API routes */
app.get('/', (req,res) => { res.send('Server is up'); });

app.post('/register', (req,res) => { register.handleRegister(req, res, db, bcrypt) });

app.post('/signIn', (req,res) => { signIn.handleSignIn(req, res, db, bcrypt) });

app.post('/getList', (req,res) => { users.handleGetList(req, res, db, bcrypt)});

app.get('/getProfile', (req, res) => { profiles.handleGetProfile(req, res, db, bcrypt)});

app.post('/saveProfile', (req,res) => { profiles.handleSaveProfile(req, res, db, bcrypt)});

app.post('/sendMessage', (req,res) => { messaging.handleSendMessage(req, res, db, bcrypt)});

app.post('/getMessages', (req,res) => { messaging.handleGetMessages(req, res, db, bcrypt)});


app.listen(process.env.PORT || 3000, () => {
	console.log('Server started');
});

/*
0: success
1: wrong credentials
2: user does not exist
3: missing arguments
4: invalid parameters
5: database error
6: existing email
*/