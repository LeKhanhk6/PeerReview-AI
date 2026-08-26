import { NetworkBanner } from './components/common/NetworkBanner/NetworkBanner';

const appName = "PeerReview-AI";

function App() {
  return (
    <>
      <NetworkBanner />
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <main>
          <h1 className="text-4xl font-bold">{appName}</h1>
        </main>
      </div>
    </>
  )
}

export default App
