import React, { useState } from 'react';
import { Table, Space, Button, Tag, Modal, message } from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
    PlusOutlined,
    ShopOutlined,           // Thay cho restaurant
    CoffeeOutlined,          // Giữ nguyên
    RestOutlined,            // Thay cho pizza/hamburger
    FireOutlined,            // Thay cho drink/beer
    CrownOutlined,           // Thay cho wine
    GiftOutlined,            // Thay cho dessert/cake
    RiseOutlined,            // Thay cho rice/noodles
    AppleOutlined,           // Thay cho salad
    ShoppingOutlined,        // Thay cho snack
    SmileOutlined,           // Icon mặc định
    HomeOutlined,
    StarOutlined,
    HeartOutlined,
    ThunderboltOutlined,
    EnvironmentOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiService } from '../../services/api';
import CategoryForm from './CategoryForm';
import { showDeleteConfirm } from '../common/ConfirmDialog';
import './CategoryList.scss';

// Mapping icon names to Ant Design components
const iconMap = {
    // Danh mục chính
    'restaurant': ShopOutlined,
    'coffee': CoffeeOutlined,
    'pizza': RestOutlined,
    'hamburger': RestOutlined,
    'drink': FireOutlined,
    'beer': FireOutlined,
    'wine': CrownOutlined,
    'dessert': GiftOutlined,
    'cake': GiftOutlined,
    'ice-cream': GiftOutlined,
    'rice': RiseOutlined,
    'noodles': RiseOutlined,
    'soup': FireOutlined,
    'salad': AppleOutlined,
    'snack': ShoppingOutlined,
    'fastfood': ThunderboltOutlined,
    'breakfast': CoffeeOutlined,
    'lunch': RestOutlined,
    'dinner': RestOutlined,
    'tea': CoffeeOutlined,
    'appetizer': AppleOutlined,
    'main-dish': RestOutlined,
    'seafood': EnvironmentOutlined,
    'grill': FireOutlined,
    'hotpot': FireOutlined,
    'noodle': RiseOutlined,
    'rice': RiseOutlined,
    'bread': HomeOutlined,
    'cake': GiftOutlined,
    'juice': CoffeeOutlined,
    'soda': FireOutlined,
    'cocktail': CrownOutlined,

    // Icon mặc định nếu không tìm thấy
    'default': ShopOutlined
};

// Component hiển thị icon
const CategoryIcon = ({ icon, size = 20, color = '#1890ff' }) => {
    const IconComponent = iconMap[icon] || iconMap['default'];
    return <IconComponent style={{ fontSize: size, color }} />;
};

const CategoryList = ({ onEdit, canEdit, canDelete }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);

    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery(
        'categories',
        () => apiService.getCategories({ limit: 100 }).then(res => res.data)
    );

    const deleteMutation = useMutation(
        (id) => apiService.deleteCategory(id),
        {
            onSuccess: () => {
                queryClient.invalidateQueries('categories');
                message.success('Xóa danh mục thành công');
            },
            onError: (error) => {
                message.error(error.response?.data?.message || 'Xóa danh mục thất bại');
            }
        }
    );

    const handleEdit = (category) => {
        setSelectedCategory(category);
        setModalVisible(true);
    };

    const handleDelete = (category) => {
        showDeleteConfirm({
            content: `Bạn có chắc chắn muốn xóa danh mục "${category.name}"?`,
            onOk: () => deleteMutation.mutate(category.id)
        });
    };

    const handleSuccess = () => {
        setModalVisible(false);
        setSelectedCategory(null);
        queryClient.invalidateQueries('categories');
    };

    const columns = [
        {
            title: 'Tên danh mục',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <Space>
                    <span className="category-icon">
                        <CategoryIcon icon={record.icon} size={18} color="#1890ff" />
                    </span>
                    <strong>{text}</strong>
                    {record.name_en && (
                        <span className="text-muted">({record.name_en})</span>
                    )}
                </Space>
            )
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            render: (text) => text || '—'
        },
        {
            title: 'Số món',
            key: 'itemCount',
            align: 'center',
            render: (_, record) => (
                <Tag color="blue">{record.menuItems?.length || 0}</Tag>
            )
        },
        {
            title: 'Thứ tự',
            dataIndex: 'sort_order',
            key: 'sort_order',
            sorter: (a, b) => a.sort_order - b.sort_order,
            align: 'center'
        },
        {
            title: 'Trạng thái',
            dataIndex: 'is_active',
            key: 'is_active',
            align: 'center',
            render: (isActive) => (
                <Tag color={isActive ? 'success' : 'default'}>
                    {isActive ? 'Hoạt động' : 'Ẩn'}
                </Tag>
            )
        },
        {
            title: 'Thao tác',
            key: 'action',
            align: 'center',
            render: (_, record) => (
                <Space size="small">
                    {canEdit && (
                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            size="small"
                            onClick={() => handleEdit(record)}
                        />
                    )}
                    {canDelete && (
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            size="small"
                            onClick={() => handleDelete(record)}
                        />
                    )}
                </Space>
            )
        }
    ];

    const categories = data?.data || [];

    return (
        <div className="category-list">
            {/* <div className="list-header">
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        setSelectedCategory(null);
                        setModalVisible(true);
                    }}
                    disabled={!canEdit}
                >

                </Button>
            </div> */}

            <Table
                columns={columns}
                dataSource={categories}
                rowKey="id"
                loading={isLoading}
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng ${total} danh mục`
                }}
            />

            <Modal
                title={selectedCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    setSelectedCategory(null);
                }}
                footer={null}
                width={600}
            >
                <CategoryForm
                    initialValues={selectedCategory}
                    onSuccess={handleSuccess}
                    onCancel={() => {
                        setModalVisible(false);
                        setSelectedCategory(null);
                    }}
                />
            </Modal>
        </div>
    );
};

export default CategoryList;