
import { useEffect, useState } from "react";
import { BrowserProvider } from "ethers";
import "./WalletConnect.css";

function WalletConnect() {
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const getWalletDetails = async (address) => {
    setAccount(address || "");

    if (address && window.ethereum) {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        setChainId(network.chainId.toString());
      } catch {
        setChainId("");
      }
    } else {
      setChainId("");
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setMessage(
        "MetaMask was not detected. Install the MetaMask browser extension and try again."
      );
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length > 0) {
        await getWalletDetails(accounts[0]);
        setMessage("Wallet connected successfully.");
      }
    } catch (error) {
      if (error.code === 4001) {
        setMessage("Connection request was cancelled.");
      } else {
        setMessage("Could not connect. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    // This disconnects the wallet from this interface only.
    // It does not revoke MetaMask's site permissions.
    setAccount("");
    setChainId("");
    setMessage("Wallet disconnected from the interface.");
  };

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAccount("");
        setChainId("");
        setMessage("No wallet account is currently connected.");
      } else {
        getWalletDetails(accounts[0]);
        setMessage("");
      }
    };

    const handleChainChanged = () => {
      // Refresh the displayed network information.
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener(
        "accountsChanged",
        handleAccountsChanged
      );
      window.ethereum.removeListener(
        "chainChanged",
        handleChainChanged
      );
    };
  }, []);

  return (
    <div className="wallet-connect">
      <div className="wallet-connect-top">
        <div className="wallet-symbol">◈</div>
        <div>
          <h3>Wallet Connection</h3>
          <p>Connect your wallet to access blockchain features.</p>
        </div>
      </div>

      {account ? (
        <div className="wallet-connected">
          <span className="wallet-status-dot"></span>
          <span>Wallet connected</span>

          <div className="wallet-address-label">Wallet address</div>
          <div className="wallet-address">{account}</div>

          <div className="wallet-network">
            Network Chain ID: {chainId || "Unavailable"}
          </div>

          <button
            className="wallet-button wallet-disconnect"
            onClick={disconnectWallet}
          >
            Disconnect from interface
          </button>
        </div>
      ) : (
        <button
          className="wallet-button"
          onClick={connectWallet}
          disabled={loading}
        >
          {loading ? "Connecting..." : "Connect MetaMask"}
        </button>
      )}

      {message && (
        <p className="wallet-message" role="status">
          {message}
        </p>
      )}

      <p className="wallet-disclaimer">
        Connecting shares your public wallet address with this site.
        Never share your recovery phrase or private key.
      </p>
    </div>
  );
}

export default WalletConnect;
