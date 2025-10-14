import React, { createContext, useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import contractABI from '../contracts/WarehouseLeasing.json';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState(null);

  // Contract address - sẽ được cập nhật sau khi deploy
  const contractAddress = contractABI.address || '0x5FbDB2315678afecb367f032d93F642f64180aa3';

  useEffect(() => {
    checkIfWalletIsConnected();
    
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const checkIfWalletIsConnected = async () => {
    try {
      if (!window.ethereum) {
        console.log('MetaMask is not installed');
        return;
      }

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length > 0) {
        await connectWallet();
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        toast.error('Vui lòng cài đặt MetaMask!');
        return;
      }

      // Đảm bảo đang ở Localhost 8545 (chainId 1337)
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x539' }], // 1337
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          // Chưa có chain, thêm chain Localhost 8545
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x539',
              chainName: 'Localhost 8545',
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['http://127.0.0.1:8545']
            }]
          });
        } else {
          throw switchError;
        }
      }

      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();
      const network = await web3Provider.getNetwork();

      // Khởi tạo contract
      const warehouseContract = new ethers.Contract(
        contractAddress,
        contractABI.abi,
        web3Signer
      );

      setAccount(accounts[0]);
      setProvider(web3Provider);
      setSigner(web3Signer);
      setContract(warehouseContract);
      setChainId(network.chainId);
      setIsConnected(true);

      toast.success('Đã kết nối ví thành công!');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Không thể kết nối ví!');
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setContract(null);
    setIsConnected(false);
    toast.info('Đã ngắt kết nối ví');
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else if (accounts[0] !== account) {
      setAccount(accounts[0]);
      toast.info('Đã chuyển tài khoản');
    }
  };

  const handleChainChanged = () => {
    window.location.reload();
  };

  const switchToLocalNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x539' }], // 1337 in hex
      });
    } catch (error) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x539',
              chainName: 'Localhost 8545',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: ['http://127.0.0.1:8545']
            }]
          });
        } catch (addError) {
          console.error('Error adding network:', addError);
        }
      }
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const value = {
    account,
    provider,
    signer,
    contract,
    isConnected,
    chainId,
    contractAddress,
    connectWallet,
    disconnectWallet,
    switchToLocalNetwork,
    formatAddress
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};


