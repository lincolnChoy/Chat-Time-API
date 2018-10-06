const handleSendMessage = (req, res, db, bcrypt) => {

	/* Get body of request */
	const { pw, message } = req.body;

	var { sender, destination } = req.body;
	sender = parseInt(sender);
	destination = parseInt(destination);

	if (!sender || !pw || !destination || !message) {
		return res.status(400).json({ code : '3' });
	}

	/* Grab hash from login table of requested id */
	db.select('hash').from('loginct')
	.where('id','=', sender)
	.then(user => {

		/* Make sure that this user exists */
		if (user != "") {

			/* Use synchronous hash compare */
			const isValid = bcrypt.compareSync(pw,user[0].hash);

			if (isValid) {

				/* Message timestamp */
				const timeStamp = ((new Date).getTime()).toString();

				/* Transaction for consistency */
				db.transaction(trx => {

					const timeStamp = ((new Date).getTime()).toString();
					
					/* First insert into primary message table */
					trx.insert({
						sender : sender,
						destination : destination,
						message : message,
						timestamp : timeStamp
					})
					.into('messagesct')
					.returning('*')
					.then(id => {
						return trx('messagebufferct')
						.returning('*')
						.insert({
							sender : sender,
							destination : destination,
							message : message,
							timestamp : timeStamp
						})
						.then(message => {
							return res.status(200).json({ code : '0' });
						})
					})
					/* Commit changes */
					.then(trx.commit)
					/* Delete transaction if failed anywhere */
					.catch(trx.rollback)
				})
				/* Return 400 if failed */
				.catch(err => res.status(400).json({ code : '5' }));	
			}
			else {
				return res.status(200).json({ code : '1' });
			}

		}
	})


}

module.exports = {
	handleSendMessage : handleSendMessage
}