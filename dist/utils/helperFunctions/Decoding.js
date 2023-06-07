import fs from "fs";
import { getTransactionReceipt, getTransferEvents, getTxReceipt, getWeb3HttpProvider } from "./Web3.js";
import * as dotenv from "dotenv";
import { getPriceOf_WETH } from "../priceAPI/priceAPI.js";
import fetch from "node-fetch";
dotenv.config();
async function getCallTraceViaAlchemy(txHash) {
    const API_KEY = process.env.ALCHEMY;
    const url = `https://eth-mainnet.g.alchemy.com/v2/${API_KEY}`;
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            method: "trace_transaction",
            params: [txHash],
            id: 1,
            jsonrpc: "2.0",
        }),
    });
    if (response.status !== 200) {
        return "request failed";
    }
    const data = (await response.json());
    return data.result;
}
async function getSpecificGas(txHash, from) {
    const ADDRESS_TRICRYPTOUSDC = "0x7F86Bf177Dd4F3494b841a37e810A34dD56c829B".toLowerCase();
    const ADDRESS_NEWER_TRICRYPTO = "0xf5f5B97624542D72A9E06f04804Bf81baA15e2B4".toLowerCase();
    await new Promise((resolve) => setTimeout(resolve, 5000)); //5 second timeout to give Alchemy time to pick up the tx for Traces.
    const SIMULATION = await getCallTraceViaAlchemy(txHash);
    if (SIMULATION === "request failed")
        return "¯⧵_(ツ)_/¯";
    let maxGasUsed = 0;
    for (let i = 0; i < SIMULATION.length; i++) {
        const { action, result } = SIMULATION[i];
        const { from, to } = action;
        const { gasUsed } = result;
        if (from.toLowerCase() === ADDRESS_TRICRYPTOUSDC ||
            to.toLowerCase() === ADDRESS_TRICRYPTOUSDC ||
            from.toLowerCase() === ADDRESS_NEWER_TRICRYPTO ||
            to.toLowerCase() === ADDRESS_NEWER_TRICRYPTO) {
            const gasUsedDecimal = parseInt(gasUsed, 16);
            if (gasUsedDecimal > maxGasUsed) {
                maxGasUsed = gasUsedDecimal;
            }
        }
    }
    return maxGasUsed;
}
async function getWBTCPrice(blockNumber) {
    let web3 = getWeb3HttpProvider();
    const ADDRESS_TRICRYPTO = "0xD51a44d3FaE010294C616388b506AcdA1bfAAE46";
    const ABI_TRICRYPTO_RAW = fs.readFileSync("../JSONs/OLD_TRICRYPTOAbi.json", "utf8");
    const ABI_TRICRYPTO = JSON.parse(ABI_TRICRYPTO_RAW);
    const TRICRYPTO = new web3.eth.Contract(ABI_TRICRYPTO, ADDRESS_TRICRYPTO);
    try {
        return (await TRICRYPTO.methods.price_oracle(0).call(blockNumber)) / 1e18;
    }
    catch (error) {
        return null;
    }
}
async function getWETHPrice(blockNumber) {
    let web3 = getWeb3HttpProvider();
    const ADDRESS_TRICRYPTO = "0xD51a44d3FaE010294C616388b506AcdA1bfAAE46";
    const ABI_TRICRYPTO_RAW = fs.readFileSync("../JSONs/OLD_TRICRYPTOAbi.json", "utf8");
    const ABI_TRICRYPTO = JSON.parse(ABI_TRICRYPTO_RAW);
    const TRICRYPTO = new web3.eth.Contract(ABI_TRICRYPTO, ADDRESS_TRICRYPTO);
    try {
        return (await TRICRYPTO.methods.price_oracle(1).call(blockNumber)) / 1e18;
    }
    catch (error) {
        return null;
    }
}
async function getGasUsed(txHash) {
    try {
        const txReceipt = await getTransactionReceipt(txHash);
        const gasUsed = txReceipt.gasUsed;
        return gasUsed;
    }
    catch (error) {
        console.error(error);
        return null;
    }
}
async function getLastPrices0(blockNumber) {
    let web3 = getWeb3HttpProvider();
    const ADDRESS_NEW_TRICRYPTO = "0x7F86Bf177Dd4F3494b841a37e810A34dD56c829B";
    const ABI_NEW_TRICRYPTO_RAW = fs.readFileSync("../JSONs/NEWTRICRYPTOAbi.json", "utf8");
    const ABI_NEW_TRICRYPTO = JSON.parse(ABI_NEW_TRICRYPTO_RAW);
    const NEW_TRICRYPTO = new web3.eth.Contract(ABI_NEW_TRICRYPTO, ADDRESS_NEW_TRICRYPTO);
    return (await NEW_TRICRYPTO.methods.last_prices(0).call(blockNumber)) / 1e18;
}
async function getLastPrices1(blockNumber) {
    let web3 = getWeb3HttpProvider();
    const ADDRESS_NEW_TRICRYPTO = "0x7F86Bf177Dd4F3494b841a37e810A34dD56c829B";
    const ABI_NEW_TRICRYPTO_RAW = fs.readFileSync("../JSONs/NEWTRICRYPTOAbi.json", "utf8");
    const ABI_NEW_TRICRYPTO = JSON.parse(ABI_NEW_TRICRYPTO_RAW);
    const NEW_TRICRYPTO = new web3.eth.Contract(ABI_NEW_TRICRYPTO, ADDRESS_NEW_TRICRYPTO);
    return (await NEW_TRICRYPTO.methods.last_prices(1).call(blockNumber)) / 1e18;
}
async function checkForWETH(txHash, buyer) {
    const txReceipt = await getTxReceipt(txHash);
    const transferEvents = await getTransferEvents(txReceipt, buyer);
    const ADDRESS_WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
    for (const event of transferEvents) {
        if (event.token.toLowerCase() === ADDRESS_WETH.toLowerCase()) {
            return true;
        }
    }
    return false;
}
async function getFee(source, blockNumber) {
    try {
        let contractAddress;
        if (source === "TricryptoUSDC") {
            contractAddress = "0x7F86Bf177Dd4F3494b841a37e810A34dD56c829B";
        }
        else if (source === "TricryptoUSDT") {
            contractAddress = "0xf5f5B97624542D72A9E06f04804Bf81baA15e2B4";
        }
        let web3 = getWeb3HttpProvider();
        const ABI_NEW_TRICRYPTO_RAW = fs.readFileSync("../JSONs/NEWTRICRYPTOAbi.json", "utf8");
        const ABI_NEW_TRICRYPTO = JSON.parse(ABI_NEW_TRICRYPTO_RAW);
        const CONTRACT = new web3.eth.Contract(ABI_NEW_TRICRYPTO, contractAddress);
        return (await CONTRACT.methods.fee().call(blockNumber)) / 1e8;
    }
    catch (err) {
        console.log(err);
        return null;
    }
}
async function getBalanceWBTC(contract, blockNumber) {
    try {
        let balance = await contract.methods.balances(1).call(blockNumber);
        return Number(balance / 1e8);
    }
    catch (err) {
        console.log(err);
        return null;
    }
}
async function getBalanceUSDC_or_USDT(contract, blockNumber) {
    try {
        let balance = await contract.methods.balances(0).call(blockNumber);
        return Number(balance / 1e6);
    }
    catch (err) {
        console.log(err);
        return null;
    }
}
async function getBalanceETH(contract, blockNumber) {
    try {
        let balance = await contract.methods.balances(2).call(blockNumber);
        return Number(balance / 1e18);
    }
    catch (err) {
        console.log(err);
        return null;
    }
}
async function getTVL(source, blockNumber) {
    try {
        let contractAddress;
        if (source === "TricryptoUSDC") {
            contractAddress = "0x7F86Bf177Dd4F3494b841a37e810A34dD56c829B";
        }
        else if (source === "TricryptoUSDT") {
            contractAddress = "0xf5f5B97624542D72A9E06f04804Bf81baA15e2B4";
        }
        let web3 = getWeb3HttpProvider();
        const ABI_NEW_TRICRYPTO_RAW = fs.readFileSync("../JSONs/NEWTRICRYPTOAbi.json", "utf8");
        const ABI_NEW_TRICRYPTO = JSON.parse(ABI_NEW_TRICRYPTO_RAW);
        const CONTRACT = new web3.eth.Contract(ABI_NEW_TRICRYPTO, contractAddress);
        const BALANCE_ETH = await getBalanceETH(CONTRACT, blockNumber);
        if (!BALANCE_ETH)
            return null;
        const BALANCE_USDC_USDT = await getBalanceUSDC_or_USDT(CONTRACT, blockNumber);
        if (!BALANCE_USDC_USDT)
            return null;
        const BALANCE_WBTC = await getBalanceWBTC(CONTRACT, blockNumber);
        if (!BALANCE_WBTC)
            return null;
        const PRICE_ETH = await getPriceOf_WETH(blockNumber);
        if (!PRICE_ETH)
            return null;
        const PRICE_BTC = await getWBTCPrice(blockNumber);
        if (!PRICE_BTC)
            return null;
        const PRICE_USDC_USDT = 1;
        return BALANCE_ETH * PRICE_ETH + BALANCE_WBTC * PRICE_BTC + BALANCE_USDC_USDT * PRICE_USDC_USDT;
        //
    }
    catch (err) {
        console.log(err);
        return null;
    }
}
export async function processTokenExchangeEvent(event, source) {
    let txHash = event.transactionHash;
    let buyer = event.returnValues.buyer;
    let gasUsed = await getSpecificGas(txHash, buyer);
    if (!gasUsed) {
        console.log(`Failed to fetch gas used for transaction: ${txHash}`);
        return null;
    }
    let soldAmount = parseInt(event.returnValues.tokens_sold);
    let value;
    let soldName;
    if (event.returnValues.sold_id === "0") {
        soldName = "USDC";
        soldAmount = soldAmount / 1e6;
        value = soldAmount;
    }
    else if (event.returnValues.sold_id === "1") {
        soldName = "WBTC";
        soldAmount = soldAmount / 1e8;
        let price = await getWBTCPrice(event.blockNumber);
        if (!price) {
            console.log(`Failed to fetch WBTC price at block: ${event.blockNumber}`);
            return null;
        }
        value = soldAmount * price;
    }
    else if (event.returnValues.sold_id === "2") {
        soldName = "WETH";
        soldAmount = soldAmount / 1e18;
        let price = await getWETHPrice(event.blockNumber);
        if (!price) {
            console.log(`Failed to fetch WETH price at block: ${event.blockNumber}`);
            return null;
        }
        value = soldAmount * price;
    }
    let boughtAmount = parseInt(event.returnValues.tokens_bought);
    let boughtName;
    if (event.returnValues.bought_id === "0") {
        boughtName = "USDC";
        boughtAmount = boughtAmount / 1e6;
    }
    else if (event.returnValues.bought_id === "1") {
        boughtName = "WBTC";
        boughtAmount = boughtAmount / 1e8;
    }
    else if (event.returnValues.bought_id === "2") {
        boughtName = "WETH";
        boughtAmount = boughtAmount / 1e18;
    }
    let lastPrices0 = await getLastPrices0(event.blockNumber);
    if (!lastPrices0) {
        console.log(`Failed to fetch lastPrices0 at block: ${event.blockNumber}`);
        return null;
    }
    let lastPrices1 = await getLastPrices1(event.blockNumber);
    if (!lastPrices1) {
        console.log(`Failed to fetch lastPrices1 at block: ${event.blockNumber}`);
        return null;
    }
    let TOTAL_DOLLAR_VALUE = value;
    const hasWETH = await checkForWETH(event.transactionHash, buyer);
    const fee = await getFee(source, event.blockNumber);
    const TVL = await getTVL(source, event.blockNumber);
    return { TVL, hasWETH, lastPrices0, lastPrices1, txHash, buyer, gasUsed, TOTAL_DOLLAR_VALUE, soldName, soldAmount, boughtName, boughtAmount, fee };
}
export async function processRemoveLiquidityOneEvent(event, source) {
    let txHash = event.transactionHash;
    let buyer = event.returnValues.provider;
    let gasUsed = await getSpecificGas(txHash, buyer);
    if (!gasUsed) {
        console.log(`Failed to fetch gas used for transaction: ${txHash}`);
        return null;
    }
    let amount = parseInt(event.returnValues.coin_amount);
    let value;
    let coinName;
    if (event.returnValues.coin_index === "0") {
        coinName = "USDC";
        amount = amount / 1e6;
        value = amount;
    }
    else if (event.returnValues.coin_index === "1") {
        coinName = "WBTC";
        amount = amount / 1e8;
        let price = await getWBTCPrice(event.blockNumber);
        if (!price) {
            console.log(`Failed to fetch WBTC price at block: ${event.blockNumber}`);
            return null;
        }
        value = amount * price;
    }
    else if (event.returnValues.coin_index === "2") {
        coinName = "WETH";
        amount = amount / 1e18;
        let price = await getWETHPrice(event.blockNumber);
        if (!price) {
            console.log(`Failed to fetch WETH price at block: ${event.blockNumber}`);
            return null;
        }
        value = amount * price;
    }
    let lastPrices0 = await getLastPrices0(event.blockNumber);
    if (!lastPrices0) {
        console.log(`Failed to fetch lastPrices0 at block: ${event.blockNumber}`);
        return null;
    }
    let lastPrices1 = await getLastPrices1(event.blockNumber);
    if (!lastPrices1) {
        console.log(`Failed to fetch lastPrices1 at block: ${event.blockNumber}`);
        return null;
    }
    let TOTAL_DOLLAR_VALUE = value;
    const hasWETH = await checkForWETH(event.transactionHash, buyer);
    const fee = await getFee(source, event.blockNumber);
    const TVL = await getTVL(source, event.blockNumber);
    return { TVL, hasWETH, lastPrices0, lastPrices1, txHash, buyer, amount, gasUsed, TOTAL_DOLLAR_VALUE, coinName, fee };
}
export async function processRemoveLiquidityEvent(event, source) {
    let txHash = event.transactionHash;
    let buyer = event.returnValues.provider;
    let gasUsed = await getSpecificGas(txHash, buyer);
    if (!gasUsed) {
        console.log(`Failed to fetch gas used for transaction: ${txHash}`);
        return null;
    }
    let amount_usdc = parseInt(event.returnValues.token_amounts[0]) / 1e6;
    let amount_wbtc = parseInt(event.returnValues.token_amounts[1]) / 1e8;
    let amount_WETH = parseInt(event.returnValues.token_amounts[2]) / 1e18;
    let valueUSDC = amount_usdc;
    let valueBTC = 0;
    if (amount_wbtc > 0) {
        let priceBTC = await getWBTCPrice(event.blockNumber);
        if (!priceBTC) {
            console.log(`Failed to fetch WBTC price at block: ${event.blockNumber}`);
            return null;
        }
        valueBTC = amount_wbtc * priceBTC;
    }
    let valueETH = 0;
    if (amount_WETH > 0) {
        let priceETH = await getWETHPrice(event.blockNumber);
        if (!priceETH) {
            console.log(`Failed to fetch WETH price at block: ${event.blockNumber}`);
            return null;
        }
        valueETH = amount_WETH * priceETH;
    }
    if (valueETH === null || valueETH === undefined)
        return;
    if (valueBTC === null || valueBTC === undefined)
        return;
    let lastPrices0 = await getLastPrices0(event.blockNumber);
    if (!lastPrices0) {
        console.log(`Failed to fetch lastPrices0 at block: ${event.blockNumber}`);
        return null;
    }
    let lastPrices1 = await getLastPrices1(event.blockNumber);
    if (!lastPrices1) {
        console.log(`Failed to fetch lastPrices1 at block: ${event.blockNumber}`);
        return null;
    }
    let TOTAL_DOLLAR_VALUE = valueUSDC + valueBTC + valueETH;
    const hasWETH = await checkForWETH(event.transactionHash, buyer);
    const fee = await getFee(source, event.blockNumber);
    const TVL = await getTVL(source, event.blockNumber);
    return { TVL, hasWETH, lastPrices0, lastPrices1, txHash, buyer, amount_usdc, amount_wbtc, amount_WETH, gasUsed, TOTAL_DOLLAR_VALUE, fee };
}
export async function processAddLiquidityEvent(event, source) {
    let txHash = event.transactionHash;
    let buyer = event.returnValues.provider;
    let gasUsed = await getSpecificGas(txHash, buyer);
    if (!gasUsed) {
        console.log(`Failed to fetch gas used for transaction: ${txHash}`);
        return null;
    }
    let added_usdc = parseInt(event.returnValues.token_amounts[0]) / 1e6;
    let added_wbtc = parseInt(event.returnValues.token_amounts[1]) / 1e8;
    let added_WETH = parseInt(event.returnValues.token_amounts[2]) / 1e18;
    let valueUSDC = added_usdc;
    let valueBTC = 0;
    if (added_wbtc > 0) {
        let priceBTC = await getWBTCPrice(event.blockNumber);
        if (!priceBTC) {
            console.log(`Failed to fetch WBTC price at block: ${event.blockNumber}`);
            return null;
        }
        valueBTC = added_wbtc * priceBTC;
    }
    let valueETH = 0;
    if (added_WETH > 0) {
        let priceETH = await getWETHPrice(event.blockNumber);
        if (!priceETH) {
            console.log(`Failed to fetch WETH price at block: ${event.blockNumber}`);
            return null;
        }
        valueETH = added_WETH * priceETH;
    }
    if (valueETH === null || valueETH === undefined)
        return;
    if (valueBTC === null || valueBTC === undefined)
        return;
    let lastPrices0 = await getLastPrices0(event.blockNumber);
    if (!lastPrices0) {
        console.log(`Failed to fetch lastPrices0 at block: ${event.blockNumber}`);
        return null;
    }
    let lastPrices1 = await getLastPrices1(event.blockNumber);
    if (!lastPrices1) {
        console.log(`Failed to fetch lastPrices1 at block: ${event.blockNumber}`);
        return null;
    }
    let TOTAL_DOLLAR_VALUE = valueUSDC + valueBTC + valueETH;
    const hasWETH = await checkForWETH(event.transactionHash, buyer);
    const fee = await getFee(source, event.blockNumber);
    const TVL = await getTVL(source, event.blockNumber);
    return { TVL, hasWETH, lastPrices0, lastPrices1, txHash, buyer, added_usdc, added_wbtc, added_WETH, gasUsed, TOTAL_DOLLAR_VALUE, fee };
}
//# sourceMappingURL=Decoding.js.map