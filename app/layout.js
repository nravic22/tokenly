import './globals.css';

export const metadata = {
  title: 'Tokenly — Crypto Recognition Platform',
  description: 'Recognize your teammates and reward them with KUDOS tokens on Solana. A Bonusly-like platform powered by blockchain.',
  keywords: 'tokenly, recognition, solana, blockchain, employee rewards, crypto, SPL tokens',
  openGraph: {
    title: 'Tokenly — Crypto Recognition Platform',
    description: 'Recognize your teammates and reward them with KUDOS tokens on Solana.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}
