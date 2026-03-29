const { Table, Order } = require('../models');
const QRCode = require('qrcode');
const { getIO } = require('../config/socket');
const { Op } = require('sequelize');

// @desc    Get all tables
// @route   GET /api/tables
// @access  Private
const getTables = async (req, res) => {
    try {
        const { status, location, page = 1, limit = 10 } = req.query;

        const where = {};
        if (status) where.status = status;
        if (location) where.location = location;

        const offset = (page - 1) * limit;

        const tables = await Table.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['table_number', 'ASC']],
            include: [
                {
                    model: Order,
                    as: 'orders',
                    where: {
                        status: { [Op.notIn]: ['completed', 'paid', 'cancelled'] }
                    },
                    required: false,
                    limit: 1,
                    order: [['createdAt', 'DESC']]
                }
            ]
        });

        res.json({
            success: true,
            data: tables.rows,
            pagination: {
                total: tables.count,
                page: parseInt(page),
                pages: Math.ceil(tables.count / limit)
            }
        });
    } catch (error) {
        console.error('Get tables error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get single table
// @route   GET /api/tables/:id
// @access  Public/Private
const getTableById = async (req, res) => {
    try {
        const table = await Table.findByPk(req.params.id, {
            include: [
                {
                    model: Order,
                    as: 'orders',
                    where: {
                        status: { [Op.notIn]: ['completed', 'paid', 'cancelled'] }
                    },
                    required: false,
                    include: [
                        {
                            association: 'items',
                            include: ['menuItem']
                        }
                    ]
                }
            ]
        });

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        res.json({
            success: true,
            data: table
        });
    } catch (error) {
        console.error('Get table error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Create table
// @route   POST /api/tables
// @access  Private/Admin
const createTable = async (req, res) => {
    try {
        const { table_number, capacity, location, description } = req.body;

        // Check if table number exists
        const existingTable = await Table.findOne({ where: { table_number } });
        if (existingTable) {
            return res.status(400).json({
                success: false,
                message: 'Table number already exists'
            });
        }

        const table = await Table.create({
            table_number,
            capacity,
            location,
            description
        });

        const io = getIO();
        io.emit('table-created', table);

        res.status(201).json({
            success: true,
            data: table
        });
    } catch (error) {
        console.error('Create table error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update table
// @route   PUT /api/tables/:id
// @access  Private/Admin
const updateTable = async (req, res) => {
    try {
        const table = await Table.findByPk(req.params.id);

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        const { table_number, capacity, status, location, description, is_active } = req.body;

        // Check if new table number already exists
        if (table_number && table_number !== table.table_number) {
            const existingTable = await Table.findOne({ where: { table_number } });
            if (existingTable) {
                return res.status(400).json({
                    success: false,
                    message: 'Table number already exists'
                });
            }
        }

        await table.update({
            table_number: table_number || table.table_number,
            capacity: capacity || table.capacity,
            status: status || table.status,
            location: location || table.location,
            description: description !== undefined ? description : table.description,
            is_active: is_active !== undefined ? is_active : table.is_active
        });

        const io = getIO();
        io.emit('table-updated', table);

        res.json({
            success: true,
            data: table
        });
    } catch (error) {
        console.error('Update table error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Delete table
// @route   DELETE /api/tables/:id
// @access  Private/Admin
const deleteTable = async (req, res) => {
    try {
        const table = await Table.findByPk(req.params.id);

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        // Check if table has active orders
        const activeOrders = await Order.count({
            where: {
                table_id: table.id,
                status: { [Op.notIn]: ['completed', 'paid', 'cancelled'] }
            }
        });

        if (activeOrders > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete table with active orders'
            });
        }

        await table.destroy();

        const io = getIO();
        io.emit('table-deleted', { id: req.params.id });

        res.json({
            success: true,
            message: 'Table deleted successfully'
        });
    } catch (error) {
        console.error('Delete table error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Generate QR code for table
// @route   GET /api/tables/:id/qr
// @access  Private
const generateQRCode = async (req, res) => {
    try {
        const table = await Table.findByPk(req.params.id);

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        // Regenerate QR code
        const qrData = `${process.env.BASE_URL}/menu?table=${table.id}`;
        const qrCode = await QRCode.toDataURL(qrData);

        await table.update({ qr_code: qrCode, qr_code_url: qrData });

        res.json({
            success: true,
            data: {
                qr_code: qrCode,
                qr_code_url: qrData
            }
        });
    } catch (error) {
        console.error('Generate QR error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update table status
// @route   PATCH /api/tables/:id/status
// @access  Private
const updateTableStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const table = await Table.findByPk(req.params.id);

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        await table.update({ status });

        const io = getIO();
        io.emit('table-status-updated', {
            tableId: table.id,
            status,
            timestamp: new Date()
        });

        res.json({
            success: true,
            data: table
        });
    } catch (error) {
        console.error('Update table status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    getTables,
    getTableById,
    createTable,
    updateTable,
    deleteTable,
    generateQRCode,
    updateTableStatus
};