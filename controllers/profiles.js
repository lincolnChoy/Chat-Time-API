const cloudinary = require('cloudinary');
const cloudConfig = require('../config');

const handleGetProfile = (req, res, db) => {


	const isInteger = Number.isInteger(parseInt(req.query.user));
	
	/* Make sure parameter is valid */
	if (!isInteger) {
		return res.status(400).json({ code: 4});
	}

	/* Identify user from query string */
	const id = +req.query.user;
	
	db.select('*')
	.from('profilect')
	.where('id','=',id)
	.then(user => {

		if (user.length === 0) {
			return res.json({ code : 2 });
		}
		else {
			const userNoName = {
				id : user[0].id, 
				occupation : user[0].occupation, 
				picture : user[0].picture, 
				blurb : user[0].blurb, 
				birthday : user[0].birthday, 
				location : user[0].location
			}
			db.select('*')
			.from('usersct')
			.where('id', '=', id)
			.then(data => {
				let userWithName = Object.assign({}, userNoName, { first: data[0].first, last: data[0].last});
				return res.status(200).json({ 
					code: 0,
					...userWithName
				})
			})

		}

	})
}


const handleSaveProfile = (req, res, db, bcrypt) => {

	/* Identify user from request body */
	const { id, pw }  = req.body;

	/* Grab hash from login table of requested login email */
	db.select('hash').from('loginct')
	.where('id','=', +id)
	.then(data => {

		/* Make sure that this user exists */
		if (data != "") {

			/* Use synchronous hash compare */
			const isValid = bcrypt.compareSync(pw,data[0].hash);
			
			/* On hash match, return the user object from user table */
			if (isValid) {

				updateProfile(db, req).then((profile) => {
					if (profile) {
						return res.json({ code: 0, profile: {
							...profile
						}});
					}
					else {
						return res.json({ code: 5 });
					}
					
				})
				.catch(err => {

					console.log(err);
					return res.json({ code : 5 });
				})

			}
			/* On password mismatch, send the error code to the front-end */
			else {
				return res.json({ code : 1 });
			}
		}
		/* If use does not exist */
		else {
			return res.json({ code : 2 });
		}

	})
	/* On db failure, send error code */
	.catch(err => {
		console.log(err);
		return res.json({ code : 5 });
	})

}

const updateProfile = (db, req) => {

	return new Promise((resolve, reject) => {

		let { id, birthday, location, occupation, blurb, picture } = req.body;

		let pictureUrl = '';

		/* Get existing data from user */
		db.select('*').from('profilect')
		.where('id', '=', id)
		.then(existingData => {

			birthday = !birthday ? existingData[0].birthday : birthday;
			location = !location ? existingData[0].location : location;
			occupation = !occupation ? existingData[0].occupation : occupation;
			blurb = !blurb ? existingData[0].blurb : blurb;
			pictureUrl = !picture ? existingData[0].picture : picture;

		})
		.then(() => {
			/* If picture was passed as an argument */
			if (picture) {
		
				uploadImage(picture).then((url) => {
					pictureUrl = url;
					db('profilect') 
					.update({ 
						birthday : birthday,
						location : location,
						occupation : occupation,
						blurb : blurb,
						picture : pictureUrl
					}).where('id','=',id)
					.returning('*')
					.then((profile) => {
						resolve(profile[0]);
					});
				});
			}
			else {
				db('profilect') 
				.update({ 
					birthday : birthday,
					location : location,
					occupation : occupation,
					blurb : blurb,
					picture : pictureUrl
				}).where('id','=',id)
				.returning('*')
				.then((profile) => {
					resolve(profile[0]);
				});
			}
		})
		.catch(err => {
			console.log(err);
			reject(err);
		})
	

	})

}

const uploadImage = async(picture) => {

	cloudConfig.config();

	const result = await cloudinary.v2.uploader.upload(picture, { resource_type: 'image' });

	return result.secure_url;
}


module.exports = {
	handleGetProfile : handleGetProfile,
	handleSaveProfile : handleSaveProfile,
	uploadImage : uploadImage
}