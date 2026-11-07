import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';

const questions = [
	{
		question: 'What does Bitewise do?',
		answer: 'Bitewise compares meal options against your budget and nutrition priorities to help you find an order that offers more value.',
	},
	{
		question: 'Are the sample menu prices current?',
		answer: 'No. Sample menu prices and nutrition details are illustrative, not live restaurant offers. You can add a menu of your own for a more relevant comparison.',
	},
	{
		question: 'How do I compare my own menu?',
		answer: 'From the home page, choose the option to add a menu, enter a restaurant name, and paste its menu text. Bitewise will parse the items and include them in your results.',
	},
	{
		question: 'What can I filter by?',
		answer: 'You can set a spending budget, choose a nutrition goal and minimum score, select restaurants, and account for dietary restrictions. You can also include combination meals.',
	},
	{
		question: 'How does distance filtering work?',
		answer: 'If you save a ZIP code in your account and enable distance limits, recommendations can be limited to nearby sample locations. Distances shown for sample restaurants are approximate.',
	},
	{
		question: 'Do I need an account?',
		answer: 'No. You can compare the sample menu without signing in. An account lets you save preferences and view saved orders and order history.',
	},
];

export default function FAQ() {
	return (
		<>
			<Header />
			<main className="info-page faq-page">
				<div className="info-heading">
					<p className="eyebrow">A FEW QUICK ANSWERS</p>
					<h1>Frequently asked questions</h1>
					<p className="info-lede">The details behind finding a better-value meal.</p>
				</div>

				<section className="faq-list" aria-label="Frequently asked questions">
					{questions.map(({ question, answer }) => (
						<details className="faq-item" key={question}>
							<summary>
								<span>{question}</span>
								<span className="faq-toggle" aria-hidden="true">+</span>
							</summary>
							<p>{answer}</p>
						</details>
					))}
				</section>
			</main>

			<Footer />
		</>
	);
}
