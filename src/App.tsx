import { Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardPage } from './pages/DashboardPage';
import { CompanyPage } from './pages/CompanyPage';

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/company/:ticker" element={<CompanyPage />} />
      </Route>
    </Routes>
  );
}

export default App;
