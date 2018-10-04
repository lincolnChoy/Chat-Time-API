const handleSignIn = (req, res, db, bcrypt) => {
	
	/* Destructure request body */
	const { email, pw } = req.body;

	if (!(email && pw)) {
		return res.json(400).json('NOT_COMPLETE');
	}

 	/* Grab hash from login table of requested login email */
	db.select('email','hash').from('loginCT')
	.where('email','=', email)
	.then(data => {

		/* Make sure that this email exists */
		if (data != "") {
			/* Use synchronous hash compare */
			const isValid = bcrypt.compareSync(pw,data[0].hash);
			
			/* On hash match, return the user object from user table */
			if (isValid) {

				return db.select('*').from('usersCT')
				.where('email','=',email)
				.then(user => {
					if (data[0]) {
						return res.send(JSON.stringify({ code: 'SIGN_IN_SUCCESS', first : user[0].first, last : user[0].last, email : user[0].email }));
					}
				})
				.catch(err => {
					return res.send('FETCH_FAILED');
				})
			}
			/* On password mismatch, send the error code to the front-end */
			else {
				return res.send(JSON.stringify({ code : 'WRONG_CRED' }));
			}
		}
		/* If email does not exist */
		else {
			return res.send(JSON.stringify({ code : 'WRONG_CRED' }));
		}

	})
	/* On db failure, send error code */
	.catch(err => {
		return res.send(JSON.stringify({ code : 'SIGN_IN_FAILED' }));
	})


}



module.exports = {
	handleSignIn : handleSignIn
}