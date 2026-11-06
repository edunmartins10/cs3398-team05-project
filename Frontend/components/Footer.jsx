import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-about">
          <Link className="brand footerbrand" to="/">bitewise.</Link>
          <p>A little math. A better lunch.</p>
        </div>

        <nav className="footer-nav" aria-label="Footer navigation">
          <h2>Explore</h2>
          <Link to="/">Meal finder</Link>
          <Link to="/faq">Frequently asked questions</Link>
          <Link to="/account">Account</Link>
        </nav>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Bitewise</span>
        <a href="https://unsplash.com/photos/burger-with-lettuce-and-fries-PxJ9zkM2wdA" target="_blank" rel="noreferrer">
          Photo: Unsplash ↗
        </a>
      </div>
    </footer>
  );
}