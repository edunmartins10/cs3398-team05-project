import { Link } from 'react-router-dom';

export default function Header({ onOpenImport, profile, onOpenAuth, onSignOut, onDonate }) {
  return (
    <header>
      <a className="brand" href="./">
        <span className="brandmark">b.</span>bitewise      </a>
      <span className="headernote">Good food. Smarter spending.</span>
      <nav className="header-actions" aria-label="Main actions">
        <button className="text-button donate-nav" type="button" onClick={onDonate}>Donate</button>
        {profile ? (
          <>
            <Link className="text-button account-nav" to="/account">Account</Link>
            <button className="text-button account-nav" type="button" onClick={onSignOut}>Log out</button>
          </>
        ) : <button className="text-button account-nav" type="button" onClick={onOpenAuth}>Log in</button>}
        <button className="outline" type="button" onClick={onOpenImport}>＋ Analyze a menu</button>
      </nav>
    </header>
  );
}
