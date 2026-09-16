import AuthGate from '../components/AuthGate'
import NativeBanner from '../components/NativeBanner'

export default function Home() {
  return <main><NativeBanner /><AuthGate /></main>
}
