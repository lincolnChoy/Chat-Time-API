const isBase64 = require('is-base64');
const base64Convert = require('./profiles');

const insertData = async (db, req, mes, fc) => {
	var { sender, destination } = req.body;
	sender = parseInt(sender);
	destination = parseInt(destination);
	var messageInput;
	if (fc != 10) {
		messageInput = await getUrl(mes);
	} else {
		messageInput = mes;
	}
	console.log(messageInput);
	/* Transaction for consistency */
	const assign = await db.transaction(trx => {

		const timeStamp = (new Date).getTime();

		/* First insert into primary message table */
		trx.insert({
			sender : sender,
			destination : destination,
			message : messageInput,
			timestamp : timeStamp,
			filecode: fc
		})
			.into('messagesct')
			.returning('*')
			.then(id => {
			// return trx('messagebufferct')
			// .returning('*')
			// .insert({
			// 	sender : sender,
			// 	destination : destination,
			// 	message : message,
			// 	timestamp : timeStamp
			// })
			// .then(message => {
			// 	return res.status(200).json({ code : '0' });
			// })
			})
			/* Commit changes */
			.then(trx.commit)
			/* Delete transaction if failed anywhere */
			.catch(trx.rollback)
	})
	/* Return 400 if failed */
	.catch(err => {
		console.log('error: 5');
	});
}

const getUrl = async (mes) => {
	return await base64Convert.uploadImage(mes);
}

const handleSendMessage = (req, res, db, bcrypt) => {

	/* Get body of request */
	const { pw, message } = req.body;

	var { sender, destination } = req.body;
	sender = parseInt(sender);
	destination = parseInt(destination);

	if (!sender || !pw || !destination || !message) {
		return res.status(400).json({ code : '3' });
	}

	/* Set fileCode to default 10 i.e normal message */
	var fileCode = 10;
	var url = '';
	/* Check if message is base64 encoded */
	let is64encoded = isBase64(message);
	if (is64encoded) {
		let dataType = message.split(':');
		let mimeType = dataType[1].split(';');
		mimeType = mimeType[0];
		/*
			fileCode: normal message 10, jpeg: 0, png: 1, mp3: 2, mp4: 3
		*/
		console.log('Type: ', mimeType);
		if (mimeType === 'image/jpeg') {
			fileCode = 0;
		}
		else if (mimeType === 'image/png') {
			fileCode = 1;
		}
		else if (mimeType === 'audio/mpeg') {
			fileCode = 2;
		}
		else if (mimeType === 'video/mp4') {
			fileCode = 3;
		}
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
				insertData(db, req, message, fileCode)
					.then(resp => {
						return res.status(200).json({ code : '0' });
					})	
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