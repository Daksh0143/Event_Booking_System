import type { Metadata } from 'next';
import 'bootstrap/dist/css/bootstrap.min.css';
import './custom.css';

export const metadata: Metadata = {
  title: 'Event Ticket Booking System',
  description: 'Book event tickets easily',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <header className="header">
            <h1>Event Ticket Booking System</h1>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}