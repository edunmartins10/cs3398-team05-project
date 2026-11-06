import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from "./pages/Home"
import AccountPage from './pages/Account';
import FAQ from './pages/FAQ';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage/>} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="*" element={<NotFound />} />
    </Routes>
    </BrowserRouter>
  );
}