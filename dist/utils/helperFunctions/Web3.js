import Web3 from "web3";
import dotenv from "dotenv";
import axios from "axios";
dotenv.config({ path: "../.env" });
let web3WsProvider = null;
export function getWeb3WsProvider() {
    if (!web3WsProvider) {
        web3WsProvider = new Web3(new Web3.providers.WebsocketProvider(process.env.WEB3_WSS));
    }
    return web3WsProvider;
}
let web3HttpProvider = null;
export function getWeb3HttpProvider() {
    if (!web3HttpProvider) {
        web3HttpProvider = new Web3(new Web3.providers.HttpProvider(process.env.WEB3_HTTP));
    }
    return web3HttpProvider;
}
export const ALCHEMY_KEY = process.env.WEB3_HTT;
export async function getTxReceipt(txHash) {
    try {
        const response = await axios.post(`https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY}`, {
            id: 1,
            jsonrpc: "2.0",
            method: "eth_getTransactionReceipt",
            params: [txHash],
        }, {
            timeout: 5000, // Set a timeout of 5000 milliseconds
        });
        if (response.data && response.data.result) {
            return response.data.result;
        }
        else {
            return null;
        }
    }
    catch (error) {
        const err = error;
        /*
        if (err.code !== "ECONNABORTED" && err.code !== "ERR_SOCKET_CONNECTION_TIMEOUT" && err.code !== "ERR_BAD_REQUEST") {
          // Don't log timeout errors
          console.error("Error fetching transaction receipt:", err);
        }
        */
        console.error("Error fetching transaction receipt:", err);
        return null;
    }
}
export async function getTransferEvents(receipt, userAddress) {
    const transferEvents = [];
    let web3 = getWeb3HttpProvider();
    if (receipt.logs) {
        for (const log of receipt.logs) {
            if (log.topics[0] !== "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
                continue;
            }
            // Decode the log
            const decodedLog = web3.eth.abi.decodeLog([
                { type: "address", indexed: true, name: "from" },
                { type: "address", indexed: true, name: "to" },
                { type: "uint256", indexed: false, name: "value" },
            ], log.data, log.topics.slice(1));
            // We check if this log is a transfer from or to the userAddress
            if (decodedLog.from.toLowerCase() === userAddress.toLowerCase() || decodedLog.to.toLowerCase() === userAddress.toLowerCase()) {
                // Create an object matching TransferEvent interface
                const transferEvent = {
                    from: decodedLog.from,
                    to: decodedLog.to,
                    value: decodedLog.value,
                    token: log.address, // Add the contract address generating this log
                };
                transferEvents.push(transferEvent);
            }
        }
    }
    return transferEvents;
}
export async function traceTransaction(txHash) {
    const url = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY}`;
    const headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
    };
    const data = {
        id: 1,
        jsonrpc: "2.0",
        method: "trace_transaction",
        params: [txHash],
    };
    try {
        const response = await axios.post(url, data, { headers: headers });
        return response.data;
    }
    catch (error) {
        console.error("Error tracing transaction:", error);
        throw error;
    }
}
export async function getTransactionReceipt(txHash) {
    let web3 = getWeb3HttpProvider();
    try {
        const txReceipt = await web3.eth.getTransactionReceipt(txHash);
        return txReceipt;
    }
    catch (error) {
        console.error(error);
        return null;
    }
}
//# sourceMappingURL=Web3.js.map