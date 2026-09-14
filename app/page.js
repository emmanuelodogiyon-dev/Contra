import AuthGate from '../components/AuthGate'
import AdsterraAds from '../components/AdsterraAds'

export default function Home() {
  return <main><AuthGate /><AdsterraAds /></main>
}
