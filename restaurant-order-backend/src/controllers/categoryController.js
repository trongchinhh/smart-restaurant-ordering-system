const { Category, MenuItem } = require('../models');
const { getIO } = require('../config/socket');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
    try {
        const { is_active, page = 1, limit = 20 } = req.query;

        const where = {};
        if (is_active !== undefined) where.is_active = is_active === 'true';

        const offset = (page - 1) * limit;

        const categories = await Category.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [
                ['sort_order', 'ASC'],
                ['name', 'ASC']
            ],
            include: [
                {
                    model: MenuItem,
                    as: 'menuItems',
                    where: { status: 'available' },
                    required: false,
                    limit: 4
                }
            ]
        });

        res.json({
            success: true,
            data: categories.rows,
            pagination: {
                total: categories.count,
                page: parseInt(page),
                pages: Math.ceil(categories.count / limit)
            }
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id, {
            include: [
                {
                    model: MenuItem,
                    as: 'menuItems',
                    where: { status: 'available' },
                    required: false
                }
            ]
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error('Get category error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
    try {
        const { name, name_en, description, icon, sort_order } = req.body;

        // Check if category exists
        const existingCategory = await Category.findOne({ where: { name } });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Category name already exists'
            });
        }

        const category = await Category.create({
            name,
            name_en,
            description,
            icon,
            sort_order: sort_order || 0,
            created_by: req.user.id
        });

        const io = getIO();
        io.emit('category-created', category);

        res.status(201).json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        const { name, name_en, description, icon, sort_order, is_active } = req.body;

        // Check if new name already exists
        if (name && name !== category.name) {
            const existingCategory = await Category.findOne({ where: { name } });
            if (existingCategory) {
                return res.status(400).json({
                    success: false,
                    message: 'Category name already exists'
                });
            }
        }

        await category.update({
            name: name || category.name,
            name_en: name_en !== undefined ? name_en : category.name_en,
            description: description !== undefined ? description : category.description,
            icon: icon || '',
            sort_order: sort_order !== undefined ? sort_order : category.sort_order,
            is_active: is_active !== undefined ? is_active : category.is_active
        });

        const io = getIO();
        io.emit('category-updated', category);

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Check if category has menu items
        const menuItemsCount = await MenuItem.count({
            where: { category_id: category.id }
        });

        if (menuItemsCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete category with existing menu items'
            });
        }

        await category.destroy();

        const io = getIO();
        io.emit('category-deleted', { id: req.params.id });

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};