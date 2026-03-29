import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Result, Button } from 'antd-mobile';
import './NotFoundPage.scss';

const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <div className="not-found-page">
            <Result
                status="404"
                title="404"
                description="Không tìm thấy trang bạn yêu cầu"
            />
            <Button color="primary" onClick={() => navigate('/')}>
                Về trang chủ
            </Button>
        </div>
    );
};

export default NotFoundPage;