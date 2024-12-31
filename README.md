# MCP Etherscan Server

An MCP (Model Context Protocol) server that provides Ethereum blockchain data tools via Etherscan's API. Features include checking ETH balances, viewing transaction history, tracking ERC20 transfers, fetching contract ABIs, monitoring gas prices, and resolving ENS names.

## Features

- **Balance Checking**: Get ETH balance for any Ethereum address
- **Transaction History**: View recent transactions with detailed information
- **Token Transfers**: Track ERC20 token transfers with token details
- **Contract ABI**: Fetch smart contract ABIs for development
- **Gas Prices**: Monitor current gas prices (Safe Low, Standard, Fast)
- **ENS Resolution**: Resolve Ethereum addresses to ENS names

## Prerequisites

- Node.js >= 18
- An Etherscan API key (get one at https://etherscan.io/apis)

## Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd mcp-etherscan-server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
ETHERSCAN_API_KEY=your_api_key_here
```

4. Build the project:
```bash
npm run build
```

## Running the Server

Start the server:
```bash
npm start
```

The server will run on stdio, making it compatible with MCP clients like Claude Desktop.

## How It Works

This server implements the Model Context Protocol (MCP) to provide tools for interacting with Ethereum blockchain data through Etherscan's API. Each tool is exposed as an MCP endpoint that can be called by compatible clients.

### Available Tools

1. `check-balance`
   - Input: Ethereum address
   - Output: ETH balance in both Wei and ETH

2. `get-transactions`
   - Input: Ethereum address, optional limit
   - Output: Recent transactions with timestamps, values, and addresses

3. `get-token-transfers`
   - Input: Ethereum address, optional limit
   - Output: Recent ERC20 token transfers with token details

4. `get-contract-abi`
   - Input: Contract address
   - Output: Contract ABI in JSON format

5. `get-gas-prices`
   - Input: None
   - Output: Current gas prices in Gwei

6. `get-ens-name`
   - Input: Ethereum address
   - Output: Associated ENS name if available

## Using with Claude Desktop

To add this server to Claude Desktop:

1. Start the server using `npm start`

2. In Claude Desktop:
   - Go to Settings
   - Navigate to the MCP Servers section
   - Click "Add Server"
   - Enter the following configuration:
     ```json
     {
       "name": "Etherscan Tools",
       "transport": "stdio",
       "command": "node /path/to/mcp-etherscan-server/build/index.js"
     }
     ```
   - Save the configuration

3. The Etherscan tools will now be available in your Claude conversations

### Example Usage in Claude

You can use commands like:
```
Check the balance of 0x742d35Cc6634C0532925a3b844Bc454e4438f44e
```
or
```
Show me recent transactions for vitalik.eth
```

## Development

To add new features or modify existing ones:

1. The main server logic is in `src/server.ts`
2. Etherscan API interactions are handled in `src/services/etherscanService.ts`
3. Build after changes: `npm run build`

## License

MIT License - See LICENSE file for details 