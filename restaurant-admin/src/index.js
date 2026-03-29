import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ConfigProvider } from 'antd';
import viVN from 'antd/lib/locale/vi_VN';
import App from './App';
import reportWebVitals from './reportWebVitals';
import './assets/styles/global.scss';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 30000
        }
    }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <ConfigProvider locale={viVN}>
                <App />
            </ConfigProvider>
        </QueryClientProvider>
    </React.StrictMode>
);

reportWebVitals();