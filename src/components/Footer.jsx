export default function Footer() {
    return(
      <footer>
          <span className="brand footerbrand">bitewise.</span>
          <span>A little math. A better lunch.</span>
          <button type="button" className="text-button" onClick={() => setDonationOpen(true)}>Support Bitewise</button>
          <a href="https://unsplash.com/photos/burger-with-lettuce-and-fries-PxJ9zkM2wdA" target="_blank" rel="noreferrer">Photo: Unsplash ↗</a>
        </footer>
    )
  }