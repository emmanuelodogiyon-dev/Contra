import './styles.css'

export const metadata = {
  title: 'Shadow Strike — Human Soldier Run-and-Gun',
  description: 'An original browser run-and-gun shooter starring a human soldier.',
}

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>
}
