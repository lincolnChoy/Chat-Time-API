const handleSignIn = (req, res, db, bcrypt) => {
	
	/* Destructure request body */
	const { email, pw } = req.body;

	if (!(email && pw)) {
		return res.status(400).json({ code : '3'});
	}

 	/* Grab hash from login table of requested login email */
	db.select('email','hash').from('loginct')
	.where('email','=', email)
	.then(data => {

		/* Make sure that this email exists */
		if (data != "") {

			/* Use synchronous hash compare */
			const isValid = bcrypt.compareSync(pw,data[0].hash);
			
			/* On hash match, return the user object from user table */
			if (isValid) {
				updateLastSeen(db, email).then(resp => {
					db.select('*').from('usersct')
					.where('email','=',email)
					.then(user => {
						getPicture(db, user[0].id)
						.then(picture => {
							if (data[0]) {
								return res.send({ code: '0', first : user[0].first, last : user[0].last, id : user[0].id, picture : picture });
							}	
						})
					})
					.catch(err => {
						return res.status(500).json({ code : '5' });
					})
				})

			}
			/* On password mismatch, send the error code to the front-end */
			else {
				return res.send(JSON.stringify({ code : '1' }));
			}
		}
		/* If email does not exist */
		else {
			return res.send(JSON.stringify({ code : '2' }));
		}

	})
	/* On db failure, send error code */
	.catch(err => {
		return res.send(JSON.stringify({ code : '5' }));
	})


}

const getPicture = async(db, id) => {

	const picture = await db.select('picture').from('profilect').where('id','=',id);
	return picture[0].picture;
}


const updateLastSeen = async (db, email) => {

	const timeNow = (new Date).getTime().toString();

	const updated = await db('loginct').update({ lastseen : timeNow }).where('email','=',email);

}


module.exports = {
	handleSignIn : handleSignIn
}