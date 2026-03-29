import React, { useState } from 'react';
import { Tabs, Button, Space, Modal } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import CategoryList from '../components/menu/CategoryList';
import MenuItemList from '../components/menu/MenuItemList';
import CategoryForm from '../components/menu/CategoryForm';
import MenuItemForm from '../components/menu/MenuItemForm';
import RoleGuard from '../components/common/RoleGuard';
import { usePermissions } from '../hooks/usePermissions';
import './MenuPage.scss';

const { TabPane } = Tabs;

const MenuPage = () => {
    const [activeTab, setActiveTab] = useState('categories');
    const [categoryModal, setCategoryModal] = useState(false);
    const [menuModal, setMenuModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedMenuItem, setSelectedMenuItem] = useState(null);

    const { can } = usePermissions();

    const handleAddCategory = () => {
        setSelectedCategory(null);
        setCategoryModal(true);
    };

    const handleEditCategory = (category) => {
        setSelectedCategory(category);
        setCategoryModal(true);
    };

    const handleAddMenuItem = () => {
        setSelectedMenuItem(null);
        setMenuModal(true);
    };

    const handleEditMenuItem = (item) => {
        setSelectedMenuItem(item);
        setMenuModal(true);
    };

    return (
        <RoleGuard roles={['admin', 'manager', 'receptionist', 'kitchen']}>
            <div className="menu-page">
                <div className="page-header">
                    <h1>Quản lý thực đơn</h1>
                    <Space>
                        {activeTab === 'categories' && can('createCategory') && (
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={handleAddCategory}
                            >
                                Thêm danh mục
                            </Button>
                        )}
                        {activeTab === 'items' && can('createMenuItem') && (
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={handleAddMenuItem}
                            >
                                Thêm món ăn
                            </Button>
                        )}
                    </Space>
                </div>

                <Tabs activeKey={activeTab} onChange={setActiveTab}>
                    <TabPane tab="Danh mục" key="categories">
                        <CategoryList
                            onEdit={handleEditCategory}
                            canEdit={can('updateCategory')}
                            canDelete={can('deleteCategory')}
                        />
                    </TabPane>
                    <TabPane tab="Món ăn" key="items">
                        <MenuItemList
                            onEdit={handleEditMenuItem}
                            canEdit={can('updateMenuItem')}
                            canDelete={can('deleteMenuItem')}
                        />
                    </TabPane>
                </Tabs>

                {/* Category Modal */}
                <Modal
                    title={selectedCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
                    open={categoryModal}
                    onCancel={() => {
                        setCategoryModal(false);
                        setSelectedCategory(null);
                    }}
                    footer={null}
                    width={600}
                >
                    <CategoryForm
                        initialValues={selectedCategory}
                        onSuccess={() => {
                            setCategoryModal(false);
                            setSelectedCategory(null);
                        }}
                    />
                </Modal>

                {/* Menu Item Modal */}
                <Modal
                    title={selectedMenuItem ? 'Chỉnh sửa món ăn' : 'Thêm món ăn mới'}
                    open={menuModal}
                    onCancel={() => {
                        setMenuModal(false);
                        setSelectedMenuItem(null);
                    }}
                    footer={null}
                    width={800}
                >
                    <MenuItemForm
                        initialValues={selectedMenuItem}
                        onSuccess={() => {
                            setMenuModal(false);
                            setSelectedMenuItem(null);
                        }}
                    />
                </Modal>
            </div>
        </RoleGuard>
    );
};

export default MenuPage;