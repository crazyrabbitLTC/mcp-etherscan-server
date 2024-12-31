import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { config } from 'dotenv';
import { EtherscanService } from './services/etherscanService.js';
import { z } from 'zod';

// Load environment variables
config();

const apiKey = process.env.ETHERSCAN_API_KEY;
if (!apiKey) {
  throw new Error('ETHERSCAN_API_KEY environment variable is required');
}

// Initialize Etherscan service
const etherscanService = new EtherscanService(apiKey);

// Create server instance
const server = new Server(
  {
    name: "etherscan-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define schemas for validation
const AddressSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format'),
});

const TransactionHistorySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format'),
  limit: z.number().min(1).max(100).optional(),
});

const TokenTransferSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format'),
  limit: z.number().min(1).max(100).optional(),
});

const ContractSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format'),
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "check-balance",
        description: "Check the ETH balance of an Ethereum address",
        inputSchema: {
          type: "object",
          properties: {
            address: {
              type: "string",
              description: "Ethereum address (0x format)",
              pattern: "^0x[a-fA-F0-9]{40}$"
            },
          },
          required: ["address"],
        },
      },
      {
        name: "get-transactions",
        description: "Get recent transactions for an Ethereum address",
        inputSchema: {
          type: "object",
          properties: {
            address: {
              type: "string",
              description: "Ethereum address (0x format)",
              pattern: "^0x[a-fA-F0-9]{40}$"
            },
            limit: {
              type: "number",
              description: "Number of transactions to return (max 100)",
              minimum: 1,
              maximum: 100
            },
          },
          required: ["address"],
        },
      },
      {
        name: "get-token-transfers",
        description: "Get ERC20 token transfers for an Ethereum address",
        inputSchema: {
          type: "object",
          properties: {
            address: {
              type: "string",
              description: "Ethereum address (0x format)",
              pattern: "^0x[a-fA-F0-9]{40}$"
            },
            limit: {
              type: "number",
              description: "Number of transfers to return (max 100)",
              minimum: 1,
              maximum: 100
            },
          },
          required: ["address"],
        },
      },
      {
        name: "get-contract-abi",
        description: "Get the ABI for a smart contract",
        inputSchema: {
          type: "object",
          properties: {
            address: {
              type: "string",
              description: "Contract address (0x format)",
              pattern: "^0x[a-fA-F0-9]{40}$"
            },
          },
          required: ["address"],
        },
      },
      {
        name: "get-gas-prices",
        description: "Get current gas prices in Gwei",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get-ens-name",
        description: "Get the ENS name for an Ethereum address",
        inputSchema: {
          type: "object",
          properties: {
            address: {
              type: "string",
              description: "Ethereum address (0x format)",
              pattern: "^0x[a-fA-F0-9]{40}$"
            },
          },
          required: ["address"],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "check-balance") {
    try {
      const { address } = AddressSchema.parse(args);
      const balance = await etherscanService.getAddressBalance(address);
      const response = `Address: ${balance.address}\nBalance: ${balance.balanceInEth} ETH`;
      return {
        content: [{ type: "text", text: response }],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid input: ${error.errors.map(e => e.message).join(", ")}`);
      }
      throw error;
    }
  }

  if (name === "get-transactions") {
    try {
      const { address, limit } = TransactionHistorySchema.parse(args);
      const transactions = await etherscanService.getTransactionHistory(address, limit);
      const formattedTransactions = transactions.map(tx => {
        const date = new Date(tx.timestamp * 1000).toLocaleString();
        return `Block ${tx.blockNumber} (${date}):\n` +
               `Hash: ${tx.hash}\n` +
               `From: ${tx.from}\n` +
               `To: ${tx.to}\n` +
               `Value: ${tx.value} ETH\n` +
               `---`;
      }).join('\n');

      const response = transactions.length > 0
        ? `Recent transactions for ${address}:\n\n${formattedTransactions}`
        : `No transactions found for ${address}`;

      return {
        content: [{ type: "text", text: response }],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid input: ${error.errors.map(e => e.message).join(", ")}`);
      }
      throw error;
    }
  }

  if (name === "get-token-transfers") {
    try {
      const { address, limit } = TokenTransferSchema.parse(args);
      const transfers = await etherscanService.getTokenTransfers(address, limit);
      const formattedTransfers = transfers.map(tx => {
        const date = new Date(tx.timestamp * 1000).toLocaleString();
        return `Block ${tx.blockNumber} (${date}):\n` +
               `Token: ${tx.tokenName} (${tx.tokenSymbol})\n` +
               `From: ${tx.from}\n` +
               `To: ${tx.to}\n` +
               `Value: ${tx.value}\n` +
               `Contract: ${tx.token}\n` +
               `---`;
      }).join('\n');

      const response = transfers.length > 0
        ? `Recent token transfers for ${address}:\n\n${formattedTransfers}`
        : `No token transfers found for ${address}`;

      return {
        content: [{ type: "text", text: response }],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid input: ${error.errors.map(e => e.message).join(", ")}`);
      }
      throw error;
    }
  }

  if (name === "get-contract-abi") {
    try {
      const { address } = ContractSchema.parse(args);
      const abi = await etherscanService.getContractABI(address);
      return {
        content: [{ type: "text", text: `Contract ABI for ${address}:\n\n${abi}` }],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid input: ${error.errors.map(e => e.message).join(", ")}`);
      }
      throw error;
    }
  }

  if (name === "get-gas-prices") {
    try {
      const prices = await etherscanService.getGasOracle();
      const response = `Current Gas Prices:\n` +
                      `Safe Low: ${prices.safeGwei} Gwei\n` +
                      `Standard: ${prices.proposeGwei} Gwei\n` +
                      `Fast: ${prices.fastGwei} Gwei`;
      return {
        content: [{ type: "text", text: response }],
      };
    } catch (error) {
      throw error;
    }
  }

  if (name === "get-ens-name") {
    try {
      const { address } = AddressSchema.parse(args);
      const ensName = await etherscanService.getENSName(address);
      const response = ensName
        ? `ENS name for ${address}: ${ensName}`
        : `No ENS name found for ${address}`;
      return {
        content: [{ type: "text", text: response }],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid input: ${error.errors.map(e => e.message).join(", ")}`);
      }
      throw error;
    }
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Start the server
export async function startServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Etherscan MCP Server running on stdio");
} 