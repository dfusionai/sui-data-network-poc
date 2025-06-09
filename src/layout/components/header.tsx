import { ConnectButton } from "@mysten/dapp-kit";

const Header = () => {
  return (
    <div>
        <header className="sticky top-0 z-10 backdrop-blur-lg bg-gray-900/80 border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
              Seal Admin Portal
            </h1>
          </div>

          <ConnectButton />
        </div>
      </header>
    </div>
  )
}

export default Header;
