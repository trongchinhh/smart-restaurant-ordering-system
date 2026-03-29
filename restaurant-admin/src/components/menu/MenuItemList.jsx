import React, { useState, useMemo } from 'react';
import { Table, Space, Button, Tag, Image, Tooltip, Select, Input } from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
    CopyOutlined,
    EyeOutlined,
    SearchOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiService } from '../../services/api';
import { UPLOAD_URL, MENU_ITEM_STATUS } from '../../services/config';
import { showDeleteConfirm } from '../common/ConfirmDialog';
import { message } from 'antd';
import './MenuItemList.scss';
import logo from '../../assets/images/logo.jpg';
const { Option } = Select;

const MenuItemList = ({ onEdit, canEdit, canDelete }) => {
    const [filters, setFilters] = useState({
        category_id: '',
        status: '',
        search: '',
        page: 1,
        limit: 20
    });

    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery(
        ['menuItems', filters],
        () => apiService.getMenuItems(filters).then(res =>

            res.data
        )
    );

    const deleteMutation = useMutation(
        (id) => apiService.deleteMenuItem(id),
        {
            onSuccess: () => {
                queryClient.invalidateQueries('menuItems');
                message.success('Xóa món ăn thành công');
            },
            onError: (error) => {
                message.error(error.response?.data?.message || 'Xóa món ăn thất bại');
            }
        }
    );

    const statusMutation = useMutation(
        ({ id, status }) => apiService.updateMenuItemStatus(id, status),
        {
            onSuccess: () => {
                queryClient.invalidateQueries('menuItems');
                queryClient.invalidateQueries('categories');
                message.success('Cập nhật trạng thái thành công');
            }
        }
    );

    const { data: categoriesData } = useQuery(
        'categories',
        () => apiService.getCategories({ limit: 100 }).then(res => res.data)
    );

    const handleDelete = (item) => {
        showDeleteConfirm({
            content: `Bạn có chắc chắn muốn xóa món "${item.name}"?`,
            onOk: () => deleteMutation.mutate(item.id)
        });
    };

    const handleStatusChange = (id, status) => {
        statusMutation.mutate({ id, status });
    };

    const getStatusColor = (status) => {
        const colors = {
            available: 'success',
            unavailable: 'default',
            sold_out: 'error'
        };
        return colors[status] || 'default';
    };

    const getStatusText = (status) => {
        const texts = {
            available: 'Còn món',
            unavailable: 'Hết món',
            sold_out: 'Tạm hết'
        };
        return texts[status] || status;
    };

    const columns = [

        // Trong columns
        {
            title: 'Hình ảnh',
            key: 'image',
            width: 90,
            render: (_, record) => {

                const imageUrl = record.image_url
                    ? `${UPLOAD_URL}${record.image_url}`
                    : '';

                return (
                    <Image
                        src={imageUrl}
                        alt={record.name}
                        width={55}
                        height={55}
                        style={{
                            objectFit: "cover",
                            borderRadius: 8
                        }}
                        fallback={logo}
                        preview={{
                            src: imageUrl
                        }}
                    />
                );
            }
        },
        {
            title: 'Tên món',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <Space direction="vertical" size={0}>
                    <strong>{text}</strong>
                    {record.name_en && <small className="text-muted">{record.name_en}</small>}
                </Space>
            )
        },
        {
            title: 'Danh mục',
            dataIndex: ['category', 'name'],
            key: 'category',
            render: (text) => <Tag>{text}</Tag>
        },
        {
            title: 'Giá',
            dataIndex: 'price',
            key: 'price',
            render: (price, record) => {
                const format = (value) =>
                    new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                    }).format(value);

                const hasDiscount =
                    record.discount_price !== null &&
                    record.discount_price !== undefined;
                const percent =
                    hasDiscount
                        ? Math.round((1 - record.discount_price / price) * 100)
                        : 0;
                return (
                    <Space direction="vertical" size={0}>
                        <span className="price">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)}
                        </span>
                        {record.discount_price && (
                            <>
                                <span className="discount-price">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(record.discount_price)} (-{percent}%)
                                </span>

                            </>
                        )}



                    </Space>
                )
            }
        },
        {
            title: 'Thời gian CB',
            dataIndex: 'preparation_time',
            key: 'preparation_time',
            render: (time) => `${time} phút`
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status, record) => (
                <Select
                    value={status}
                    onChange={(value) => handleStatusChange(record.id, value)}
                    size="small"
                    style={{ width: 120 }}
                    disabled={!canEdit}
                >
                    <Option value="available">
                        <Tag color="success">Còn món</Tag>
                    </Option>
                    <Option value="unavailable">
                        <Tag color="default">Hết món</Tag>
                    </Option>
                    <Option value="sold_out">
                        <Tag color="error">Tạm hết</Tag>
                    </Option>
                </Select>
            )
        },
        {
            title: 'Đặc điểm',
            key: 'features',
            render: (_, record) => (
                <Space>
                    {record.is_recommended && <Tag color="gold">Gợi ý</Tag>}
                    {record.is_new && <Tag color="green">Mới</Tag>}
                </Space>
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
                                onClick={() => handleDelete(record)}
                            />
                        </Tooltip>
                    )}
                    <Tooltip title="Nhân bản">
                        <Button
                            icon={<CopyOutlined />}
                            size="small"
                            onClick={() => onEdit({ ...record, id: undefined, name: `${record.name} (Copy)` })}
                        />
                    </Tooltip>
                </Space>
            )
        }
    ];

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const categories = categoriesData?.data || [];

    return (
        <div className="menu-item-list">
            <div className="filter-section">
                <Space wrap>
                    <Input
                        placeholder="Tìm kiếm món ăn..."
                        prefix={<SearchOutlined />}
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        style={{ width: 250 }}
                        allowClear
                    />
                    <Select
                        placeholder="Lọc theo danh mục"
                        value={filters.category_id}
                        onChange={(value) => handleFilterChange('category_id', value)}
                        style={{ width: 200 }}
                        allowClear
                    >
                        {categories.map(cat => (
                            <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                        ))}
                    </Select>
                    <Select
                        placeholder="Lọc theo trạng thái"
                        value={filters.status}
                        onChange={(value) => handleFilterChange('status', value)}
                        style={{ width: 150 }}
                        allowClear
                    >
                        <Option value="available">Còn món</Option>
                        <Option value="unavailable">Hết món</Option>
                        <Option value="sold_out">Tạm hết</Option>
                    </Select>
                </Space>
            </div>

            <Table
                columns={columns}
                dataSource={data?.data || []}
                rowKey="id"
                loading={isLoading}
                pagination={{
                    ...data?.pagination,
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng số ${total} món ăn`,
                    onChange: (page, pageSize) => {
                        setFilters(prev => ({ ...prev, page, limit: pageSize }));
                    }
                }}
            />
        </div>
    );
};

export default MenuItemList;