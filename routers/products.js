const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { Category } = require('../models/category');
const { Product } = require('../models/product');

const FILE_TYPE_MAP = {
	'image/png': 'png',
	'image/jpeg': 'jpeg',
	'image/jpg': 'jpg',
};

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		const isValid = FILE_TYPE_MAP[file.mimetype];
		let uploadError = new Error('Invalid image type');

		if (isValid) uploadError = null;

		cb(uploadError, 'public/uploads');
	},
	filename: function (req, file, cb) {
		const fileName = file.originalname.split(' ').join('-');
		const extention = FILE_TYPE_MAP[file.mimetype];
		cb(
			null,
			`${fileName}-${Date.now()}-${Math.round(
				Math.random() * 1e9,
			)}.${extention}`,
		);
	},
});

const upload = multer({ storage: storage });

const router = express.Router();

router.get('/', async (req, res) => {
	let filter = {};

	if (req.query.categories) {
		filter = { category: req.query.categories.split(',') };
	}

	const productList = await Product.find(filter).populate('category');

	if (!productList) res.status(500).json({ success: false });

	res.send(productList);
});

router.post('/', upload.single('image'), async (req, res) => {
	const category = await Category.findById(req.body.category);
	const file = req.file;

	if (!category) return res.status(400).send('Invalid category');
	if (!file) return res.status(400).send('No image in the request');

	const fileName = file.filename;
	const basePath = `${req.protocol}://${req.get('host')}/public/upload/`;
	const imagepath = `${basePath}${fileName}`;

	let product = new Product({
		name: req.body.name,
		description: req.body.description,
		richDescription: req.body.richDescription,
		image: imagepath,
		brand: req.body.brand,
		price: req.body.price,
		category: req.body.category,
		rating: req.body.rating,
		numReviews: req.body.numReviews,
		isFeatured: req.body.isFeatured,
		dateCreated: req.body.dateCreated,
		countInStock: req.body.countInStock,
	});

	product = await product.save();

	if (!product) return res.status(500).send('The product can not be created');

	res.send(product);
});

router.get('/:id', async (req, res) => {
	const product = await Product.findById(req.params.id).populate('category');

	if (!product)
		return res.status(500).json({ message: 'The product is not found' });

	res.status(200).send(product);
});

router.put('/:id', upload.single('image'), async (req, res) => {
	if (!mongoose.isValidObjectId(req.params.id))
		return res.status(400).send('Invalid product ID');

	const category = await Category.findById(req.body.category);
	const product = await Product.findById(req.params.id);

	if (!category) return res.status(400).send('Invalid category');
	if (!product) return res.status(400).send('Invalid product');

	const file = req.file;
	let imagePath;

	if (file) {
		const fileName = file.filename;
		const basePath = `${req.protocol}://${req.get('host')}/public/upload/`;
		imagePath = `${basePath}${fileName}`;
	} else {
		imagePath = product.image;
	}

	const updatedProduct = await Product.findByIdAndUpdate(
		req.params.id,
		{
			name: req.body.name,
			description: req.body.description,
			richDescription: req.body.richDescription,
			image: imagePath,
			brand: req.body.brand,
			price: req.body.price,
			category: req.body.category,
			rating: req.body.rating,
			numReviews: req.body.numReviews,
			isFeatured: req.body.isFeatured,
			dateCreated: req.body.dateCreated,
			countInStock: req.body.countInStock,
		},
		{ new: true },
	);

	if (!updatedProduct)
		return res.status(400).json('the product cannot be updated');

	res.send(updatedProduct);
});

router.delete('/:id', async (req, res) => {
	try {
		const product = await Product.findByIdAndDelete(req.params.id);
		if (product) {
			return res
				.status(200)
				.json({ success: true, message: 'The product is deleted' });
		} else {
			return send
				.status(404)
				.json({ success: false, message: 'product is not found' });
		}
	} catch (error) {
		return res.status(500).json({ success: false, error });
	}
});

router.get('/get/count', async (req, res) => {
	const productCount = await Product.countDocuments();

	if (!productCount) {
		res.send(500).json({ success: false });
	}

	res.send({ productCount });
});

router.get('/get/featured', async (req, res) => {
	const count = req.query.count || 0;
	const products = await Product.find({ isFeatured: true }).limit(+count);

	if (!products) {
		res.send(500).json({ success: false });
	}

	res.send(products);
});

router.put(
	'/gallery-images/:id',
	upload.array('images', 10),
	async (req, res) => {
		if (!mongoose.isValidObjectId(req.params.id)) {
			return res.status(400).send('Invalid product ID');
		}

		const files = req.files;
		const imagesPaths = [];
		const basePath = `${req.protocol}://${req.get('host')}/public/upload/`;

		if (files) {
			files.map((f) => {
				imagesPaths.push(`${basePath}${f.filename}`);
			});
		}

		const product = await Product.findByIdAndUpdate(
			req.params.id,
			{ images: imagesPaths },
			{ new: true },
		);

		if (!product) return res.status(400).json('the product cannot be updated');

		res.send(product);
	},
);

module.exports = router;
