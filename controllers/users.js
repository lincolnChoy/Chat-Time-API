const handleGetList = (req, res, db, bcrypt) => {
	
	/* Destructure request body */
	const { id, pw } = req.body;

	if (!(id && pw)) {
		return res.status(400).json({ code : '3'});
	}

 	/* Grab hash from login table of requested login email */
	db.select('hash').from('loginct')
	.where('id','=', id)
	.then(data => {

		/* Make sure that this email exists */
		if (data != "") {
			/* Use synchronous hash compare */
			const isValid = bcrypt.compareSync(pw,data[0].hash);
			
			/* On hash match, return all the online users */
			if (isValid) {

				/* Return the users who have been online */
				getUsers(db, id)
				.then(onlineUsers => {
					return res.status(200).json({ code: '0', users : onlineUsers });	
				});

			}
			/* On password mismatch, send the error code to the front-end */
			else {
				return res.status(200).json({ code : '1' });
			}
		}
		/* If email does not exist */
		else {
			return res.status(200).json({ code : '2' });
		}

	})
	/* On db failure, send error code */
	.catch(err => {
		return res.status(500).json({ code : '5' });
	})


}

const getUsers = async (db, id) => {

	/* Get time now and return all users who have pinged the server within the last 5 minutes */
	const timeNow = (new Date).getTime();

	/* Initial array of online users */
	let onlineUsers = [];

	/* Get all the users from the database to compare their login times */
	const users = await db.select('*').from('loginct').where('id','!=',id);

	for (var i =0;i<users.length;i++) {
		/* User must be online within last 5 minutes */
		if ((timeNow - ((60*5) * 1000)) <= parseInt(users[i].lastseen)) {
			const user = await db.select('*').from('usersct').where('id','=', users[i].id);
			const lastSeen = await updateLastSeen(db, id);
			const picture = await db.select('picture').from('profilect').where('id','=', users[i].id);
			userInfo = {
				first : user[0].first,
				last : user[0].last,
				id : user[0].id,
				lastSeen : users[i].lastseen,
				picture : picture[0].picture
			}
			onlineUsers.push(userInfo);
		}
	} 
	return onlineUsers;

}

const getAllUsers = async (db, id) => {

	/* Get time now and return all users who have pinged the server within the last 5 minutes */
	const timeNow = (new Date).getTime();

	/* Initial array of online users */
	let onlineUsers = [];

	const users = await db.select('*').from('loginct').where('id','!=',id);

	for (var i =0;i<users.length;i++) {
		const user = await db.select('*').from('usersct').where('id','=', users[i].id);
		const picture = await db.select('picture').from('profilect').where('id','=', users[i].id);
		userInfo = {
			first : user[0].first,
			last : user[0].last,
			id : user[0].id,
			lastSeen : users[i].lastseen,
			picture : picture[0].picture
		}
		onlineUsers.push(userInfo);
	}
	
	return onlineUsers;

}

const updateLastSeen = async (db, id) => {

	const timeNow = (new Date).getTime().toString();

	const updated = await db('loginct').update({ lastseen : timeNow }).where('id','=',id);

}

module.exports = {
	handleGetList : handleGetList
}