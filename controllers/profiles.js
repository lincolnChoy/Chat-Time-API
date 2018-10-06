const handleGetProfile = (req, res, db, bcrypt) => {


	const isInteger = Number.isInteger(parseInt(req.query.user));
	if (!isInteger) {
		return res.status(400).json('INVALID_PARAMS');
	}
	/* Identify user from query string */
	const id = req.query.user;
	
	db.select('*')
	.from('profilect')
	.where('id','=',id)
	.then(user => {

		if (user === "") {
			return res.status(404).send('PROFILE_FAIL');
		}
		else {
			return res.status(200).json({ 
				code : 'PROFILE_FETCHED',
				id : user[0].id, 
				occupation : user[0].occupation, 
				picture : user[0].picture, 
				blurb : user[0].blurb, 
				birthday : user[0].birthday, 
				location : user[0].location
			})
		}

	})
}

const handleSaveProfile = (req, res, db, bcrypt) => {

	/* Identify user from request body */
	const { id, pw}  = req.body;

	/* Grab hash from login table of requested login email */
	db.select('hash').from('loginct')
	.where('id','=', id)
	.then(data => {

		/* Make sure that this user exists */
		if (data != "") {

			/* Use synchronous hash compare */
			const isValid = bcrypt.compareSync(pw,data[0].hash);
			
			/* On hash match, return the user object from user table */
			if (isValid) {

				updateProfile(db, req).then(resp => {
					return res.send(JSON.stringify({ code: 'PROFILE_SAVED'}));
				})
				.catch(err => {
					return res.send('UPDATE_FAILED');
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
		return res.send(JSON.stringify({ code : 'PROFILE_NOT_SAVED' }));
	})

}

const updateProfile = async (db, req) => {

	const { id, birthday, location, occupation, blurb } = req.body;

	const updated = await db('profilect')
					.update({ 
						birthday : birthday,
						location : location,
						occupation : occupation,
						blurb : blurb
					}).where('id','=',id);

}


module.exports = {
	handleGetProfile : handleGetProfile,
	handleSaveProfile : handleSaveProfile
}