import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ThankYouPage.scss';

const ThankYouPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Chặn nút back bằng cách thay thế history
        window.history.pushState(null, null, window.location.href);
        window.addEventListener('popstate', function (event) {
            window.history.pushState(null, null, window.location.href);
        });


    }, [navigate]);

    return (
        <div className="thank-you-page">
            <div className="thank-you-container">
                <div className="animation">
                    <div className="checkmark-circle">
                        <div className="checkmark"></div>
                    </div>
                </div>

                <h1>CẢM ƠN QUÝ KHÁCH!</h1>

                <p className="message">
                    Đơn hàng của quý khách đã được ghi nhận.
                    <br />
                    Vui lòng chờ trong giây lát, nhân viên sẽ chuẩn bị món cho quý khách.
                </p>

                <div className="order-info">
                    <p>🍽️ Thời gian chờ: 15-20 phút</p>
                    <p>🥡 Vui lòng đến quầy để nhận món</p>
                </div>


            </div>
        </div>
    );
};

export default ThankYouPage;