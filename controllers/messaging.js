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

					const timeStamp = (new Date).getTime();
					
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
			/* If pw is wrong */
			else {
				return res.status(200).json({ code : '1' });
			}
		}
		/* If user not found in table */
		else {
			return res.status(200).json({ code : '2' });
		}
	})
	.catch(err => res.status(500).json({ code : '5' }));
}

const handleGetMessages = (req, res, db, bcrypt) => {

	/* Get body of request */
	const { pw, message } = req.body;

	var { sender, destination } = req.body;
	sender = parseInt(sender);
	destination = parseInt(destination);

	if (!sender || !pw || !destination) {
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
				db.select('*')
				.from('messagesct')
				.where(function() {
					this.where('sender', sender).andWhere('destination', destination)
				}).orWhere(function() {
					this.where('sender', destination).andWhere('destination', sender)
				})
				.then(messages => {
					return res.status(200).json({ code : '0' , messages : messages });
				})
			}
			/* If pw is wrong */
			else {
				return res.status(200).json({ code : '1' });
			}
		}
		/* If user not found in table */
		else {
			return res.status(400).json({ code : '2' });
		}
	})
	.catch(err => res.status(500).json({ code : '5' }));

}

module.exports = {
	handleSendMessage : handleSendMessage,
	handleGetMessages : handleGetMessages
}