import {useState, useEffect} from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from "./pages/Home"
import AccountPage from './pages/Account';
import FAQ from './pages/FAQ';
import NotFound from './pages/NotFound';
import EmailVerified from './pages/EmailVerified'
import './darkMode.css';


export default function App() {

  ///////dark mode///////
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system');

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const dark = theme === 'dark'||(theme === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', dark);
    }

    applyTheme();
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  },
   [theme]);

    const changeTheme  = (newTheme) => {
      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
    };
    //////////dark mode////////

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage/>} />
        <Route path="/account" element={<AccountPage theme={theme} changeTheme={changeTheme}/>} />
        <Route path="/faq" element={<FAQ />} />
        <Route path='/email-verified' element={<EmailVerified />}/>
        <Route path="*" element={<NotFound />} />
    </Routes>
    </BrowserRouter>
  );
}
