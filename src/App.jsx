import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from "./pages/Home"
import AccountPage from './pages/Account';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage/>} />
        <Route path="/account" element={<AccountPage />} />
    </Routes>
    </BrowserRouter>
  );
}
