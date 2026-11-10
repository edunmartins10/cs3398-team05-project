import { Link } from 'react-router-dom';
import Header from '../components/Header.jsx';

export default function NotFound() {
	return (
		<>
			<Header />
			<main className="info-page not-found-page">
				<p className="eyebrow">404 / PAGE NOT FOUND</p>
				<h1>This page took a wrong turn.</h1>
				<p className="info-lede">
					That address does not lead to a Bitewise page. Head back to the meal finder or browse the FAQ.
				</p>
				<div className="not-found-actions">
					<Link className="not-found-primary" to="/">Go to meal finder</Link>
					<Link className="not-found-secondary" to="/faq">Read the FAQ</Link>
				</div>
			</main>
		</>
	);
}
