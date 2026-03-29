import React, { useState } from 'react';
import { Table, Space, Button, Tag, Tooltip, Input, Select, Badge } from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
    QrcodeOutlined,
    EyeOutlined,
    SearchOutlined
} from '@ant-design/icons';
import { TABLE_STATUS } from '../../services/config';
import './TableList.scss';

const { Option } = Select;

const TableList = ({
    tables,
    pagination,
    loading,
    onEdit,
    onDelete,
    onShowQR,
    onStatusChange,
    canEdit,
    canDelete,
    canGenerateQR
}) => {
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const getStatusColor = (status) => {
        const colors = {
            available: 'success',
            occupied: 'processing',
            reserved: 'warning',
            cleaning: 'default'
        };
        return colors[status] || 'default';
    };

    const getStatusText = (status) => {
        const texts = {
            available: 'Trống',
            occupied: 'Đang phục vụ',
            reserved: 'Đã đặt',
            cleaning: 'Đang dọn'
        };
        return texts[status] || status;
    };

    const getLocationText = (location) => {
        const texts = {
            inside: 'Trong nhà',
            outside: 'Ngoài trời',
            vip: 'VIP'
        };
        return texts[location] || location;
    };

    const columns = [
        {
            title: 'Bàn số',
            dataIndex: 'table_number',
            key: 'table_number',
            sorter: (a, b) => a.table_number.localeCompare(b.table_number),
            render: (text) => <strong>{text}</strong>
        },
        {
            title: 'Khu vực',
            dataIndex: 'location',
            key: 'location',
            render: (location) => getLocationText(location),
            filters: [
                { text: 'Trong nhà', value: 'inside' },
                { text: 'Ngoài trời', value: 'outside' },
                { text: 'VIP', value: 'vip' }
            ],
            onFilter: (value, record) => record.location === value
        },
        {
            title: 'Sức chứa',
            dataIndex: 'capacity',
            key: 'capacity',
            sorter: (a, b) => a.capacity - b.capacity,
            render: (capacity) => `${capacity} người`
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={getStatusColor(status)}>
                    {getStatusText(status)}
                </Tag>
            ),
            filters: [
                { text: 'Trống', value: 'available' },
                { text: 'Đang phục vụ', value: 'occupied' },
                { text: 'Đã đặt', value: 'reserved' },
                { text: 'Đang dọn', value: 'cleaning' }
            ],
            onFilter: (value, record) => record.status === value
        },
        {
            title: 'Đơn hiện tại',
            key: 'currentOrder',
            render: (_, record) => {
                const activeOrder = record.orders?.[0];
                return activeOrder ? (
                    <Badge status="processing" text={`Đơn #${activeOrder.order_number}`} />
                ) : (
                    <span className="text-muted">Không có</span>
                );
            }
        },
        {
            title: 'QR Code',
            key: 'qr',
            render: (_, record) => (
                record.qr_code ? (
                    <Tooltip title="Xem QR Code">
                        <Button
                            type="link"
                            icon={<QrcodeOutlined />}
                            onClick={() => onShowQR(record)}
                            disabled={!canGenerateQR}
                        >
                            Xem QR
                        </Button>
                    </Tooltip>
                ) : (
                    <Tag color="default">Chưa có</Tag>
                )
            )
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Space size="small">
                    {canEdit && (
                        <Tooltip title="Chỉnh sửa">
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                size="small"
                                onClick={() => onEdit(record)}
                            />
                        </Tooltip>
                    )}
                    {canDelete && (
                        <Tooltip title="Xóa">
                            <Button
                                danger
                                icon={<DeleteOutlined />}
                                size="small"
                                onClick={() => onDelete(record)}
                            />
                        </Tooltip>
                    )}
                    {canGenerateQR && !record.qr_code && (
                        <Tooltip title="Tạo QR">
                            <Button
                                type="default"
                                icon={<QrcodeOutlined />}
                                size="small"
                                onClick={() => onShowQR(record)}
                            />
                        </Tooltip>
                    )}
                </Space>
            )
        }
    ];

    const handleSearch = (value) => {
        setSearchText(value);
        onStatusChange({ search: value, status: statusFilter });
    };

    const handleStatusFilter = (value) => {
        setStatusFilter(value);
        onStatusChange({ search: searchText, status: value });
    };

    return (
        <div className="table-list">
            <div className="table-filters">
                <Space>
                    <Input
                        placeholder="Tìm kiếm bàn..."
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => handleSearch(e.target.value)}
                        style={{ width: 250 }}
                        allowClear
                    />
                    <Select
                        placeholder="Lọc theo trạng thái"
                        value={statusFilter}
                        onChange={handleStatusFilter}
                        style={{ width: 180 }}
                        allowClear
                    >
                        <Option value="available">Trống</Option>
                        <Option value="occupied">Đang phục vụ</Option>
                        <Option value="reserved">Đã đặt</Option>
                        <Option value="cleaning">Đang dọn</Option>
                    </Select>
                </Space>
            </div>

            <Table
                columns={columns}
                dataSource={tables}
                rowKey="id"
                loading={loading}
                pagination={{
                    ...pagination,
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng số ${total} bàn`
                }}
                className="table-list-table"
            />
        </div>
    );
};

export default TableList;