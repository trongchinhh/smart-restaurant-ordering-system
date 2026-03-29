import React, { useRef } from 'react';
import { Card, Button, Space, Typography, message } from 'antd';
import { DownloadOutlined, PrinterOutlined, CopyOutlined } from '@ant-design/icons';
import QRCode from 'react-qr-code';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import './TableQR.scss';

const { Title, Text } = Typography;

const TableQR = ({ table, onClose }) => {
    const qrRef = useRef();

    const qrValue = `${process.env.REACT_APP_CLIENT_URL}/menu?table=${table.id}`;

    const handleDownload = async () => {
        try {
            const canvas = await html2canvas(qrRef.current);
            canvas.toBlob((blob) => {
                saveAs(blob, `QR-Ban-${table.table_number}.png`);
            });
        } catch (error) {
            message.error('Không thể tải QR Code');
        }
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - Bàn ${table.table_number}</title>
          <style>
            body { display: flex; justify-content: center; align-items: center; height: 100vh; }
            .container { text-align: center; }
            img { max-width: 300px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Bàn ${table.table_number}</h2>
            <img src="${qrValue}" />
            <p>Quét mã QR để xem thực đơn và đặt món</p>
          </div>
        </body>
      </html>
    `);
        printWindow.document.close();
        printWindow.print();
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(qrValue);
        message.success('Đã sao chép link');
    };

    return (
        <div className="table-qr">
            <Card className="qr-card">
                <div className="qr-container" ref={qrRef}>
                    <Title level={4}>Bàn {table.table_number}</Title>
                    <div className="qr-code">
                        <QRCode value={qrValue} size={256} />
                    </div>
                    <Text type="secondary">Quét mã để đặt món</Text>
                </div>

                <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 20 }}>
                    <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={handleDownload}
                        block
                    >
                        Tải xuống
                    </Button>
                    <Button
                        icon={<PrinterOutlined />}
                        onClick={handlePrint}
                        block
                    >
                        In QR Code
                    </Button>
                    <Button
                        icon={<CopyOutlined />}
                        onClick={handleCopy}
                        block
                    >
                        Sao chép link
                    </Button>
                </Space>
            </Card>
        </div>
    );
};

export default TableQR;