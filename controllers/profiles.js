const handleGetProfile = (req, res, db, bcrypt) => {

	/* Identify user from query string */
	const user = req.query.user;
	

	return res.status(200).json('API_SUCCESS');
}

module.exports = {
	handleGetProfile : handleGetProfile
}