const express = require('express');
const { User } = require('../models/user');
const bgcrypt = require('bcryptjs');
const router = express.Router();
const jwt = require('jsonwebtoken');

router.get('/', async (req, res) => {
	const userList = await User.find().select('-passwordHash');
	if (!userList) {
		res.status(500).json({ success: false });
	}
	res.send(userList);
});

router.delete('/:id', (req, res) => {
	User.findByIdAndRemove(req.params.id)
		.then((user) => {
			if (user) {
				return res
					.status(200)
					.json({ success: true, message: 'the user is deleted!' });
			} else {
				return res
					.status(404)
					.json({ success: false, message: 'user not found' });
			}
		})
		.catch((error) => res.status(400).json({ success: false, error }));
});

router.get('/:id', async (req, res) => {
	const user = await User.findById(req.params.id).select('-passwordHash');

	if (!user) {
		res
			.status(500)
			.json({ message: 'The user with the given ID is not found.' });
	}

	res.status(200).send(user);
});

router.post('/login', async (req, res) => {
	const secret = process.env.SECRET;
	const user = await User.findOne({ email: req.body.email });
	const password = req.body.password;

	if (!user) return res.status(400).send('The user not found');

	if (!password) return res.status(400).send('The password field is required');

	if (bgcrypt.compareSync(req.body.password, user.passwordHash)) {
		const token = jwt.sign({ userId: user.id, isAdmin: user.isAdmin }, secret, {
			expiresIn: '1d',
		});

		return res.status(200).send({ user: user.email, token });
	} else {
		return res.status(400).send('password is wrong');
	}
});

router.post('/register', async (req, res) => {
	let user = new User({
		name: req.body.name,
		email: req.body.email,
		passwordHash: bgcrypt.hashSync(req.body.passwordHash),
		phone: req.body.phone,
		apartment: req.body.apartment,
		street: req.body.street,
		city: req.body.city,
		zip: req.body.zip,
		country: req.body.country,
		isAdmin: req.body.isAdmin,
	});

	user = await user.save();

	if (!user) return res.status(500).send('The user can not be created');

	res.send(user);
});

router.get('/get/count', async (req, res) => {
	const userCount = await User.countDocuments();

	if (!userCount) {
		res.status(500).json({ success: false });
	}

	res.send({ userCount });
});

module.exports = router;
