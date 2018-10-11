const cloudinary = require('cloudinary');

const config = () => {
	cloudinary.config({ 
		cloud_name: 'dv7e36bfu', 
		api_key: '313464432566752', 
		api_secret: 'A4n4q7z9wkDjhNNEVkAfJE6nDmY'
	}
)}

/* 
cloudinary.config({ 
	cloud_name: process.env.CLOUD_NAME, 
	api_key: process.env.API_KEY, 
	api_secret: process.env.API_SECRET
})
*/


module.exports = {
	config : config
}