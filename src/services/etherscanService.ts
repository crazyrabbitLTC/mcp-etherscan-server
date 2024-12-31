import { ethers } from 'ethers';

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  blockNumber: number;
}

export interface TokenTransfer {
  token: string;
  tokenName: string;
  tokenSymbol: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  blockNumber: number;
}

export interface GasPrice {
  safeGwei: string;
  proposeGwei: string;
  fastGwei: string;
}

export class EtherscanService {
  private provider: ethers.EtherscanProvider;

  constructor(apiKey: string) {
    this.provider = new ethers.EtherscanProvider('mainnet', apiKey);
  }

  async getAddressBalance(address: string): Promise<{
    address: string;
    balanceInWei: bigint;
    balanceInEth: string;
  }> {
    try {
      // Validate the address
      const validAddress = ethers.getAddress(address);
      
      // Get balance in Wei
      const balanceInWei = await this.provider.getBalance(validAddress);
      
      // Convert to ETH
      const balanceInEth = ethers.formatEther(balanceInWei);

      return {
        address: validAddress,
        balanceInWei,
        balanceInEth
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get balance: ${error.message}`);
      }
      throw error;
    }
  }

  async getTransactionHistory(address: string, limit: number = 10): Promise<Transaction[]> {
    try {
      // Validate the address
      const validAddress = ethers.getAddress(address);
      
      // Get transactions directly from Etherscan API
      const result = await fetch(
        `https://api.etherscan.io/api?module=account&action=txlist&address=${validAddress}&startblock=0&endblock=99999999&page=1&offset=${limit}&sort=desc&apikey=${this.provider.apiKey}`
      );
      
      const data = await result.json();
      
      if (data.status !== "1" || !data.result) {
        throw new Error(data.message || "Failed to fetch transactions");
      }

      // Format the results
      return data.result.slice(0, limit).map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to || 'Contract Creation',
        value: ethers.formatEther(tx.value),
        timestamp: parseInt(tx.timeStamp) || 0,
        blockNumber: parseInt(tx.blockNumber) || 0
      }));
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get transaction history: ${error.message}`);
      }
      throw error;
    }
  }

  async getTokenTransfers(address: string, limit: number = 10): Promise<TokenTransfer[]> {
    try {
      const validAddress = ethers.getAddress(address);
      
      // Get ERC20 token transfers
      const result = await fetch(
        `https://api.etherscan.io/api?module=account&action=tokentx&address=${validAddress}&page=1&offset=${limit}&sort=desc&apikey=${this.provider.apiKey}`
      );
      
      const data = await result.json();
      
      if (data.status !== "1" || !data.result) {
        throw new Error(data.message || "Failed to fetch token transfers");
      }

      // Format the results
      return data.result.slice(0, limit).map((tx: any) => ({
        token: tx.contractAddress,
        tokenName: tx.tokenName,
        tokenSymbol: tx.tokenSymbol,
        from: tx.from,
        to: tx.to,
        value: ethers.formatUnits(tx.value, parseInt(tx.tokenDecimal)),
        timestamp: parseInt(tx.timeStamp) || 0,
        blockNumber: parseInt(tx.blockNumber) || 0
      }));
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get token transfers: ${error.message}`);
      }
      throw error;
    }
  }

  async getContractABI(address: string): Promise<string> {
    try {
      const validAddress = ethers.getAddress(address);
      
      // Get contract ABI
      const result = await fetch(
        `https://api.etherscan.io/api?module=contract&action=getabi&address=${validAddress}&apikey=${this.provider.apiKey}`
      );
      
      const data = await result.json();
      
      if (data.status !== "1" || !data.result) {
        throw new Error(data.message || "Failed to fetch contract ABI");
      }

      return data.result;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get contract ABI: ${error.message}`);
      }
      throw error;
    }
  }

  async getGasOracle(): Promise<GasPrice> {
    try {
      // Get current gas prices
      const result = await fetch(
        `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${this.provider.apiKey}`
      );
      
      const data = await result.json();
      
      if (data.status !== "1" || !data.result) {
        throw new Error(data.message || "Failed to fetch gas prices");
      }

      return {
        safeGwei: data.result.SafeGasPrice,
        proposeGwei: data.result.ProposeGasPrice,
        fastGwei: data.result.FastGasPrice
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get gas prices: ${error.message}`);
      }
      throw error;
    }
  }

  async getENSName(address: string): Promise<string | null> {
    try {
      const validAddress = ethers.getAddress(address);
      return await this.provider.lookupAddress(validAddress);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get ENS name: ${error.message}`);
      }
      throw error;
    }
  }
} 