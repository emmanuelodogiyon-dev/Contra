import './styles.css'

export const metadata = {
  title: 'Shadow Strike',
  description: 'Original retro run-and-gun action game.'
}

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>
}
