const setUpDB = async(db) => {

	return new Promise((resolve, reject) => {
		setUpUsers(db)
		.then(
			(complete) => {
				setUpUsers(db)
				.then(
					(complete) => {
						setUpLogin(db)
						.then(
							(complete) => {
                                setUpProfile(db).
                                then(
                                    (complete) => {
                                        setUpMessages(db)
                                        .then(
                                            (complete) => {
                                                setUpGroups(db)
                                                .then(
                                                    (complete) => {
                                                        setUpGroupMessages(db)
                                                        .then(
                                                            (complete) => {
                                                                resolve(true);
                                                            }
                                                        )
                                                    }
                                                )
                                            }
                                        )
                                    }
                                )
								
							}
						);
					}
				)
			}
		)
	})

}

const setUpUsers = (db) => {

	return new Promise((resolve, reject) => {
		db.schema.hasTable('usersct')
		.then(
			(userTableExists) => {
				if (!userTableExists) {
					db.schema.createTable('usersct', function (table) {
						table.increments('id');
						table.string('first');
						table.string('last');
						table.string('email');
					})
					.then(
						() => {
							console.log('User table created!');
							resolve(true);
						}
					)
				}
				else {
					console.log('User table : OKAY');
					resolve(true);
				}
			}
		)
	});
}


const setUpLogin = (db) => {

	return new Promise((resolve, reject) => {
		db.schema.hasTable('loginct')
		.then(
			(userTableExists) => {
				if (!userTableExists) {
					db.schema.createTable('loginct', function (table) {
						table.increments('id');
                        table.string('hash');
                        table.string('email');
                        table.integer('lastSeen');
					})
					.then(
						() => {
							console.log('Login table created!');
							resolve(true);
						}
					)
				}
				else {
					console.log('Login table : OKAY');
					resolve(true);
				}
			}
		)
	});
}


const setUpProfile = (db) => {

	return new Promise((resolve, reject) => {
		db.schema.hasTable('profilect')
		.then(
			(userTableExists) => {
				if (!userTableExists) {
					db.schema.createTable('profilect', function (table) {
                        table.increments('id');
                        table.string('occupation');
                        table.string('picture');
                        table.string('blurb');
                        table.string('birthday');
                        table.string('location');
					})
					.then(
						() => {
							console.log('Profile table created!');
							resolve(true);
						}
					)
				}
				else {
					console.log('Profile table : OKAY');
					resolve(true);
				}
			}
		)
	});
}

const setUpMessages = (db) => {

	return new Promise((resolve, reject) => {
		db.schema.hasTable('messagesct')
		.then(
			(userTableExists) => {
				if (!userTableExists) {
					db.schema.createTable('messagesct', function (table) {
                        table.integer('sender');
                        table.integer('destination');
                        table.string('message');
                        table.integer('timestamp');
                        table.integer('filecode');
					})
					.then(
						() => {
							console.log('Message table created!');
							resolve(true);
						}
					)
				}
				else {
					console.log('Message table : OKAY');
					resolve(true);
				}
			}
		)
	});
}

const setUpGroups = (db) => {

	return new Promise((resolve, reject) => {
		db.schema.hasTable('groupct')
		.then(
			(userTableExists) => {
				if (!userTableExists) {
					db.schema.createTable('groupct', function (table) {
                        table.increments('id');
                        table.string('members');
					})
					.then(
						() => {
							console.log('Group table created!');
							resolve(true);
						}
					)
				}
				else {
					console.log('Group table : OKAY');
					resolve(true);
				}
			}
		)
	});
}

const setUpGroupMessages = (db) => {

	return new Promise((resolve, reject) => {
		db.schema.hasTable('messagesct')
		.then(
			(userTableExists) => {
				if (!userTableExists) {
					db.schema.createTable('messagesct', function (table) {
                        table.integer('id');
                        table.integer('sender');
                        table.string('message');
                        table.integer('timestamp');
                        table.integer('filecode');
					})
					.then(
						() => {
							console.log('Group messages table created!');
							resolve(true);
						}
					)
				}
				else {
					console.log('Group messages table : OKAY');
					resolve(true);
				}
			}
		)
	});
}


module.exports = {
    setUpDB : setUpDB
}