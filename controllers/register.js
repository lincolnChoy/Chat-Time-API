
const nodemailer = require('nodemailer'); 
const handleRegister = (req, res, db, bcrypt) => {


	/* Destructure request body */
	const { email, first, last, pw } = req.body;

	if (!email || !first || !last || !pw) {

		return res.status(400).json('NOT_COMPLETE');
	}

	db.select('email').from('usersct')
	.where('email','=', email)
	.then(data => {
		
		/* If the email already exists, send error code back to front-end */
		if (data != "") {
			if (data[0].email) {
				return res.send(JSON.stringify({ code : 'EXISTING_EMAIL' }));
			}
		}
		else {
			/* Synchronous hashing */
			const hash = bcrypt.hashSync(pw);

			/* Transaction for consistency */
			db.transaction(trx => {

				const lastSeen = ((new Date).getTime()).toString();
				
				/* First insert into login table */
				trx.insert({
					hash : hash,
					email : email,
					lastseen : lastSeen
				})
				.into('loginct')
				/* Get email from login table if insertion was successful and add this to the users table */
				.returning('email')
				.then(loginEmail => {
					return trx('usersct')
					.returning('*')
					.insert({ 
						email : loginEmail[0],
						first : first,
						last : last
					})
					/* On successful API call, return the user object to the front-end */
					.then(user => {
						res.json({ code : 'REGISTRATION_SUCCESS', first : first, last : last, email : email });
					})
				})
				/* Commit changes */
				.then(trx.commit)
				/* Delete transaction if failed anywhere */
				.catch(trx.rollback)
			})
			/* Return 400 if failed */
			.catch(err => res.status(400).json(err));	
		}
	});


	

}



module.exports = {
	handleRegister : handleRegister
}