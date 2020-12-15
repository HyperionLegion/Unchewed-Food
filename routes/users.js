const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');

 let User = require('../models/user');
 let Fridge = require('../models/fridge');
 router.get('/register', function(req, res){
 	res.render('register');
 });

//register process
router.post('/register', function(req, res){
	const email = req.body.email;
	const username = req.body.username;
	const password = req.body.password;
	const password2 = req.body.password2;

	req.checkBody('email', 'Email is required.').notEmpty();
	req.checkBody('email', 'Email is not valid email.').isEmail();
	req.checkBody('username', 'Username is required. It does not need your name if you wish to be fully anonymous.').notEmpty();
	req.checkBody('password', 'Password is required.').notEmpty();
	req.checkBody('password2', 'Password needs to be confirmed.').notEmpty();
	req.checkBody('password2', 'Passwords do not match.').equals(req.body.password);

	let errors = req.validationErrors();

	if(errors){
		res.render('register', {errors:errors});
	}
	else{
		let newUser = new User({
			username:username,
			email:email,
			password:password
		});
		var d1, d2;
		User.exists({username:newUser.username}, function(err, user){
			if(err){
				console.log(err);
				return;
			}
			else{
				if(user){
					req.flash('danger', 'Account with this username already exists')
					res.redirect('/users/register');
				}
				else{
					User.exists({email:newUser.email}, function(err, user){
						if(err){
							console.log(err);
							return;
						}
						else{
							if(user){
								req.flash('danger', 'Account with this email already exists');
								res.redirect('/users/register');
							}
							else{
								bcrypt.genSalt(10, function(err, salt){
									if(err){
										console.log(err);
									}
									else{
									bcrypt.hash(newUser.password, salt, function(err, hash){
										if(err){
											console.log(err);
										}
										newUser.password = hash;
										newUser.save(function(){
											if(err){
												console.log(err);
												return;
											} else{
												 let newFridge = new Fridge({
												 	user_id: newUser._id,
												 	foods: [],
												 });
												newFridge.save(function(){
												 	if(err){
												 		console.log(err);
												 		return;
												 	}
												 	else{
														req.flash('success', 'You are now registered and can log in.');
														res.redirect('/users/login');
													 }
												 });
											}
										});
									});
									}
								});
							}
						}
					});
				}
			}
		});		
	}
});

//login form
router.get('/login', function(req, res){
	res.render('login');
});
//login process
router.post('/login', function(req, res, next){
	passport.authenticate('local', {
    successRedirect:'/',
    failureRedirect:'/users/login',
    failureFlash: true
  })(req, res, next);
});
router.get('/fridge', ensureAuthenticated, function(req, res){
	Fridge.findOne({user_id: req.user._id}, function(err, fridge){
		if(err){
			req.flash('danger', 'Something went wrong')
			res.redirect('/');
			console.log(err);
			return;
		}
		else{
			res.render('fridge', {fridge:fridge, date: new Date()});
		}
	});
});
router.get('/fridge/add', ensureAuthenticated, function(req, res){
	res.render('addfood');
});
router.post('/fridge/delete', ensureAuthenticated, function(req, res){
	Fridge.findOne({user_id: req.user._id}, function(err, fridge){
		if(err){
			req.flash('danger', 'Something went wrong')
			res.redirect('/');
			console.log(err);
			return;
		}
		else{
			fridge.foods = fridge.foods.filter((food) => food._id!=req.query.id);
			Fridge.update({user_id:req.user._id}, fridge, function(err){
				if(err){
					console.log(err);
					return;
				} else{
					res.redirect('/users/fridge');
				}
			});
		}
	});
});
router.post('/fridge/add', ensureAuthenticated, function(req, res){
	Fridge.findOne({user_id: req.user._id}, function(err, fridge){
		if(err){
			req.flash('danger', 'Something went wrong')
			res.redirect('/');
			console.log(err);
			return;
		}
		else{
			req.checkBody('food', 'Food name is required.').notEmpty();
	req.checkBody('expiration', 'Expiration date is required.').notEmpty();

	let errors = req.validationErrors();

	if(errors){
		res.render('fridge', {fridge: fridge, errors:errors, date: new Date()});
	}
	else{
	if(req.body.expiration==undefined){
			errors.push({'msg':'Expiration must be a date.'})
			res.render('fridge', {fridge: fridge, errors:errors, date: new Date()});
		}
		else{		
		let item = {food:req.body.food, expiration:req.body.expiration};
			fridge.foods.push(item);
			Fridge.update({user_id:req.user._id}, fridge, function(err){
				if(err){
					console.log(err);
					return;
				} else{
					res.redirect('/users/fridge');
				}
			});
		}
	}
	}
	});
});
// Access Control
function ensureAuthenticated(req, res, next){
  if(req.isAuthenticated()){
    return next();
  } else {
    req.flash('danger', 'Please login');
    res.redirect('/users/login');
  }
}
//logout process
router.get('/logout', function(req, res){
	req.logout();
	req.flash('success', 'You are logged out');
	res.redirect('/users/login');
})
module.exports = router;