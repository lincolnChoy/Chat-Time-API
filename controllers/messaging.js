const isBase64 = require('is-base64');
const cloudinary = require('cloudinary');
const cloudConfig = require('../config');

const insertData = async (db, req, mes, fc) => {

	let { sender, destination, isGroup } = req.body;

	sender = +sender;
	destination = +destination;

	let messageInput;
	
	if (fc != 10) {
		messageInput = await getUrl(mes, fc);
	} else {
		messageInput = mes;
	}

	/* Transaction for consistency */
	if (!isGroup) {
		await db.transaction(trx => {

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
				/* Commit changes */
				.then(trx.commit)
				/* Delete transaction if failed anywhere */
				.catch(trx.rollback)
		})
		/* Return 400 if failed */
		.catch(err => {
			res.json({ code : 5 });
		});
	} 
	else {

		await db.transaction(trx => {

			const timeStamp = (new Date).getTime();

			/* First insert into primary message table */
			trx.insert({
				id: destination,
				sender : sender,
				message : messageInput,
				timestamp : timeStamp,
				filecode: fc
			})
				.into('groupmessagesct')
				.returning('*')
				/* Commit changes */
				.then(trx.commit)
				/* Delete transaction if failed anywhere */
				.catch(trx.rollback)
		})
		/* Return 400 if failed */
		.catch(err => {
			res.status(400).json({ code : 5 });
		});
	}


}

const getUrl = async(b64String, type) => {

	cloudConfig.config();

	let result;

	/* Evaluate type and upload */
	if (type === 0 || type === 1) {
		result = await cloudinary.v2.uploader.upload(b64String, { resource_type: 'image', quality: 'auto:low' });
	}
	else if (type === 2 || type === 3) {
		result = await cloudinary.v2.uploader.upload(b64String, { resource_type: 'video', quality: 'auto:low' });
	}
	else {
		result = await cloudinary.v2.uploader.upload(b64String, { resource_type: 'raw', quality: 'auto:low' });
	}

	return result.secure_url;

}

const handleSendMessage = (req, res, db, bcrypt) => {

	/* Get body of request */
	const { pw, message, isFile, isGroup } = req.body;

	let { sender, destination } = req.body;

	if (!sender || !pw || !destination || !message) {
		return res.status(400).json({ code : 3 });
	}

	sender = +sender;
	destination = +destination;


	/* Set fileCode to default 10 i.e normal message */
	let fileCode = 10;

	/* If string is base64, determine the file type, 
		this value will be stored alongside the link in the database. */
	if (isFile) {

		let dataType = message.split(':');
		let mimeType = dataType[1].split(';');
		mimeType = mimeType[0];
		/* fileCode: 
			normal message 10, 
			jpeg: 0, 
			png: 1, 
			mp3: 2,
			mp4: 3 */

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
				/* Make sure that this group exists */
				if (isGroup) {
					db.select('id').from('groupct')
					.where('id', '=', destination)
					.then(group => {
						if (group == "") {
							return res.status(200).json({ code : 2 });
						}
					})
				}
				insertData(db, req, message, fileCode)
				.then(() => {
					db.select('*')
					.from('messagesct')
					.where(function() {
						this.where('sender', sender).andWhere('destination', destination)
					}).orWhere(function() {
						this.where('sender', destination).andWhere('destination', sender)
					})
					.then(messages => {
						return res.status(200).json({ code : 0 , messages : messages });
					})
				})	
			}
			/* If pw is wrong */
			else {
				return res.status(200).json({ code : 1 });
			}
		}
		/* If user not found in table */
		else {
			return res.status(200).json({ code : 2 });
		}
	})
	.catch(err => res.status(500).json({ code : 5 }));
}


const handleGetMessages = (req, res, db, bcrypt) => {

	/* Get body of request */
	const { pw, isGroup } = req.body;

	let { sender, destination } = req.body;

	if (!sender || !pw || !destination) {
		return res.status(400).json({ code : 3 });
	}

	sender = +sender;
	destination = +destination;

	/* Grab hash from login table of requested id */
	db.select('hash').from('loginct')
	.where('id','=', sender)
	.then(user => {

		/* Make sure that this user exists */
		if (user != "") {

			/* Use synchronous hash compare */
			const isValid = bcrypt.compareSync(pw,user[0].hash);

			if (isValid) {
				if (!isGroup){
					db.select('*')
					.from('messagesct')
					.where(function() {
						this.where('sender', sender).andWhere('destination', destination)
					}).orWhere(function() {
						this.where('sender', destination).andWhere('destination', sender)
					})
					.then(messages => {
						return res.status(200).json({ code : 0 , messages : messages });
					})
				}
				else {

					db.select('members').from('groupct')
					.where('id', '=', destination)
					.then(members => {
						
						/* Make sure only group members can see their messages in the group */
						var members = members[0].members;
						var groupMember = members.split(',');
						var i = 0;
						var exist = false;
						while (groupMember.length != i) {
							if (sender == groupMember[i]) {
								exist = true;
								break;
							}
							i++;
						}

						if (!exist) {
							return res.status(400).json({ code : 2 });
						} 
						else {
							db.select('*').from('groupmessagesct')
							.where('id', '=', destination)
							.then(messages => {
								return res.status(200).json({ code : 0 , messages : messages });
							})
						}

					})

					
				}
			}
			/* If pw is wrong */
			else {
				return res.status(200).json({ code : 1 });
			}
		}
		/* If user not found in table */
		else {
			return res.status(400).json({ code : 2 });
		}
	})
	.catch(err => res.status(500).json({ code : 5 }));

}

module.exports = {
	handleSendMessage : handleSendMessage,
	handleGetMessages : handleGetMessages
}