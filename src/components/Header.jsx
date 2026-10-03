export default function Header({ onOpenImport }) {
  return (
    <header>
      <a className="brand" href="./">
        <span className="brandmark">b.</span>bitewise
        <span className="beta">LAB</span>
      </a>
      <span className="headernote">Good food. Smarter spending.</span>
      <button className="outline" type="button" onClick={onOpenImport}>
        ＋ Analyze a menu
      </button>
    </header>
  );
}
