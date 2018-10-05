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
		return res.status(200).json({ 
			id : user[0].id, 
			occupation : user[0].occupation, 
			picture : user[0].picture, 
			blurb : user[0].blurb, 
			birthday : user[0].birthday, 
			location : user[0].location
		})
	})
}

module.exports = {
	handleGetProfile : handleGetProfile
}