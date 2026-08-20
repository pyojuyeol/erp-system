import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ConfigProvider, App as AntApp } from 'antd';
import koKR from 'antd/locale/ko_KR';
import { queryClient } from './app/queryClient';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { LoginPage } from './features/auth/pages/LoginPage';
import { DashboardPage } from './features/dashboard/pages/DashboardPage';
import { EmployeesPage } from './features/employees/pages/EmployeesPage';
import { DepartmentsPage } from './features/departments/pages/DepartmentsPage';
import { SalariesPage } from './features/salaries/pages/SalariesPage';
import { InventoryPage } from './features/inventory/pages/InventoryPage';
import { AccountingPage } from './features/accounting/pages/AccountingPage';
import { AttendancePage } from './features/attendance/pages/AttendancePage';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={koKR} theme={{ token: { colorPrimary: '#1677ff' } }}>
        <AntApp>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/employees" element={<EmployeesPage />} />
                  <Route path="/departments" element={<DepartmentsPage />} />
                  <Route path="/salaries" element={<SalariesPage />} />
                  <Route path="/inventory" element={<InventoryPage />} />
                  <Route path="/accounting" element={<AccountingPage />} />
                  <Route path="/attendance" element={<AttendancePage />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </AntApp>
      </ConfigProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
