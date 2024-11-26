import { ConnectWalletButton } from '@/components/ConnectWalletButton';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-black">
      <header className="flex justify-between items-center p-6">
        <h1 className="text-2xl font-bold text-green-500">Higherrrrrrr</h1>
        <ConnectWalletButton />
      </header>
      <main>{children}</main>
    </div>
  )
}