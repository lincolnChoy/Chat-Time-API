const cloudinary = require('cloudinary');



const handleGetProfile = (req, res, db, bcrypt) => {


	const isInteger = Number.isInteger(parseInt(req.query.user));
	/* Make sure parameter is valid */
	if (!isInteger) {
		return res.status(400).send(JSON.stringify({ code: '4'}))
	}
	/* Identify user from query string */
	const id = req.query.user;
	
	db.select('*')
	.from('profilect')
	.where('id','=',id)
	.then(user => {

		if (user === "") {
			return res.status(404).send({ code: '2'});
		}
		else {
			return res.status(200).json({ 
				code : '0',
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
					return res.send(JSON.stringify({ code: '0'}));
				})
				.catch(err => {
					return res.send(JSON.stringify({ code: '5'}));
				})
			}
			/* On password mismatch, send the error code to the front-end */
			else {
				return res.send(JSON.stringify({ code : '1' }));
			}
		}
		/* If use does not exist */
		else {
			return res.send(JSON.stringify({ code : '2' }));
		}

	})
	/* On db failure, send error code */
	.catch(err => {
		return res.send(JSON.stringify({ code : '5' }));
	})

}

const updateProfile = async (db, req) => {


	const { id, birthday, location, occupation, blurb, picture } = req.body;

	/* If picture was passed as an argument */
	if (picture) {

		const url = await uploadImage(picture);

		const updated = await db('profilect') 
		.update({ 
			birthday : birthday,
			location : location,
			occupation : occupation,
			blurb : blurb,
			picture : url
		}).where('id','=',id);
		console.log('updated db');

	}
	else {

		
		const updated = await db('profilect')
						.update({ 
							birthday : birthday,
							location : location,
							occupation : occupation,
							blurb : blurb
						}).where('id','=',id);
	}

}

const uploadImage = async(picture) => {

	cloudinary.config({ 
		cloud_name: process.env.CLOUD_NAME, 
		api_key: process.env.API_KEY, 
		api_secret: process.env.API_SECRET
	})

	const result = await cloudinary.v2.uploader.upload(picture);

	return result.secure_url;
}


module.exports = {
	handleGetProfile : handleGetProfile,
	handleSaveProfile : handleSaveProfile
}