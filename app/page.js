import AuthGate from '../components/AuthGate'
import NativeBanner from '../components/NativeBanner'
import TournamentLobby from '../components/TournamentLobby'

export default function Home() {
  return <main><NativeBanner /><TournamentLobby /><AuthGate /></main>
}
