const Product = require('../models/Product');

// ==================== GET ALL PRODUCTS (Public) ====================
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== GET SINGLE PRODUCT (Public) ====================
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== CREATE PRODUCT (Admin Only) ====================
exports.createProduct = async (req, res) => {
  try {
    console.log('📦 req.body:', req.body);
    console.log('🖼️ req.files:', req.files);
    console.log('👤 req.user:', req.user);

    // ✅ Auto-fill seller from logged-in admin
    req.body.seller = req.user?.id || req.user?._id;

    // ✅ Format images as objects: [{ url, alt }]
    if (req.files && req.files.length > 0) {
      req.body.images = req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        alt: req.body.name || 'Product image',
      }));
    }

    // ✅ Convert numeric strings to numbers
    if (req.body.price) req.body.price = Number(req.body.price);

    // ✅ Support both 'stock' and 'stockQuantity' from frontend
    if (req.body.stockQuantity) {
      req.body.stock = Number(req.body.stockQuantity);
      delete req.body.stockQuantity;
    }
    if (req.body.stock) req.body.stock = Number(req.body.stock);

    // ✅ Convert boolean strings
    if (req.body.isPopular) req.body.isPopular = req.body.isPopular === 'true';
    if (req.body.isVegetarian) req.body.isVegetarian = req.body.isVegetarian === 'true';
    if (req.body.isSpicy) req.body.isSpicy = req.body.isSpicy === 'true';

    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==================== UPDATE PRODUCT (Admin Only) ====================
exports.updateProduct = async (req, res) => {
  try {
    // Format new images if uploaded
    if (req.files && req.files.length > 0) {
      req.body.images = req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        alt: req.body.name || 'Product image',
      }));
    }

    if (req.body.price) req.body.price = Number(req.body.price);
    if (req.body.stockQuantity) {
      req.body.stock = Number(req.body.stockQuantity);
      delete req.body.stockQuantity;
    }
    if (req.body.stock) req.body.stock = Number(req.body.stock);

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==================== DELETE PRODUCT (Admin Only) ====================
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};