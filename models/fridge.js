const mongoose = require('mongoose');
//user schema
const FridgeSchema = mongoose.Schema({
	foods:{
		type:[{expiration: Date, food:String}],
		required:true
	},
	user_id:{
		type: String,
		required: true
	}
});

const User = module.exports = mongoose.model('Fridge', FridgeSchema);