
const handleCreateGroup = (req, res, db, bcrypt) => {


	const { id, pw } = req.body;

	/* Convert members from an int array to a string */
	var { members } = req.body;
	members = members.join();

	const founder = parseInt(id);
	if (!founder || !pw || !members) {
		return res.status(400).json({ code : 3 });
	}


	/* Validate the founder of group */
	db.select('hash').from('loginct')
	.where('id', '=', founder)
	.then(user => {

		if (user != "") {

			const isValid = bcrypt.compareSync(pw,user[0].hash);

			if (isValid) {
				db.insert({
					members: members
				})
				.into('groupct')
				.returning('*')
				.then(id => {
					return res.status(200).json({ code : 0 });
				})

			}
			else {
				return res.json({ code : 1 });
			}

		}
		else {
			return res.status(200).json({ code : 2 });
		}

	})
	.catch(err => {
		return res.status(500).json({ code : 5 });
	})

}

module.exports = {
	handleCreateGroup: handleCreateGroup
}