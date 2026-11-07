import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import { FaRegEnvelope } from 'react-icons/fa6';

export default function EmailVerified() {
  return (
    <>
      <Header />

      <main className="flex min-h-[calc(100vh-92px)] items-center justify-center px-6 py-12">
        <section
          className="w-full max-w-xl overflow-hidden rounded-[28px] border border-[#dfe5df] bg-white shadow-[0_20px_60px_rgba(23,36,30,0.08)]"
          aria-label="Email verified"
        >

          <div className="flex flex-col items-center px-6 pb-8 pt-8 text-center sm:px-10">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#176447] shadow-[0_12px_30px_rgba(23,100,71,0.25)]">
              <FaRegEnvelope className="h-10 w-10 text-[#dfff80]" />
            </div>

            <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#172b25] sm:text-4xl">
              Your email is verified.
            </h1>

            <p className="mt-4 max-w-md text-base leading-7 text-[#63726c]">
              Thanks for confirming your email. You’re all set to start using Bitewise and keep your account in sync.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-full bg-[#176447] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#124d3b]"
              >
                Back to Bitewise
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}