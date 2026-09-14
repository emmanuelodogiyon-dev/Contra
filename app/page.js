import AuthGate from '../components/AuthGate'
import InterstitialAds from '../components/InterstitialAds'
import NativeBanner from '../components/NativeBanner'

export default function Home() {
  return <main><NativeBanner /><InterstitialAds /><AuthGate /></main>
}
