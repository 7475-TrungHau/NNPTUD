const Category = require('../../models/Category');

exports.index = async (req, res) => {
    try {
        const categories = await Category.find().sort('-createdAt');
        res.json({ success: true, data: categories });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.create = (req, res) => {
    res.json({ success: true });
};

exports.store = async (req, res) => {
    try {
        const { name, slug, description } = req.body;
        const newCategory = await Category.create({ name, slug, description });
        res.json({ success: true, data: newCategory });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.edit = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
        }
        res.json({ success: true, data: category });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { name, slug, description } = req.body;
        const updatedCategory = await Category.findByIdAndUpdate(
            req.params.id,
            { name, slug, description },
            { new: true, runValidators: true }
        );
        res.json({ success: true, data: updatedCategory });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.destroy = async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Xóa danh mục thành công' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
