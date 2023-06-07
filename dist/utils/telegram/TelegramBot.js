import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
function getTokenURL(tokenAddress) {
    return "https://etherscan.io/token/" + tokenAddress;
}
function getTxHashURLfromEtherscan(txHash) {
    return "https://etherscan.io/tx/" + txHash;
}
function getPoolURL(poolAddress) {
    return "https://etherscan.io/address/" + poolAddress;
}
function getTxHashURLfromTenderly(txHash) {
    return "https://dashboard.tenderly.co/tx/mainnet/" + txHash;
}
function getTxHashURLfromOpenchain(txHash) {
    return "https://openchain.xyz/trace/ethereum/" + txHash;
}
function getBuyerURL(buyerAddress) {
    return "https://etherscan.io/address/" + buyerAddress;
}
function formatForPrint(someNumber) {
    if (typeof someNumber === "string" && someNumber.includes(","))
        return someNumber;
    someNumber = Math.abs(someNumber);
    if (someNumber > 100) {
        someNumber = Number(Number(someNumber).toFixed(0)).toLocaleString();
    }
    else if (someNumber > 5) {
        someNumber = Number(Number(someNumber).toFixed(2));
    }
    else if (someNumber > 1) {
        someNumber = Number(Number(someNumber).toFixed(3));
    }
    else if (someNumber > 0.1) {
        someNumber = Number(Number(someNumber).toFixed(3));
    }
    else if (someNumber > 0.01) {
        someNumber = Number(Number(someNumber).toFixed(4));
    }
    else {
        someNumber = Number(Number(someNumber).toFixed(5));
    }
    return someNumber;
}
function getDollarAddOn(amountStr) {
    let amount;
    if (typeof amountStr === "string") {
        amount = parseFloat(amountStr.replace(/,/g, ""));
    }
    else {
        amount = amountStr;
    }
    //amount = roundToNearest(amount);
    if (amount >= 1000000) {
        const millionAmount = amount / 1000000;
        if (Number.isInteger(millionAmount)) {
            return ` ($${millionAmount.toFixed(0)}M)`;
        }
        else {
            return ` ($${millionAmount.toFixed(2)}M)`;
        }
    }
    else if (amount >= 1000) {
        const thousandAmount = amount / 1000;
        if (Number.isInteger(thousandAmount)) {
            return ` ($${thousandAmount.toFixed(0)}k)`;
        }
        else {
            return ` ($${thousandAmount.toFixed(1)}k)`;
        }
    }
    else {
        return ` ($${amount.toFixed(2)})`;
    }
}
function getDollarAddOnWithoutBrakets(amountStr) {
    let amount;
    if (typeof amountStr === "string") {
        amount = parseFloat(amountStr.replace(/,/g, ""));
    }
    else {
        amount = amountStr;
    }
    //amount = roundToNearest(amount);
    if (amount >= 1000000) {
        const millionAmount = amount / 1000000;
        if (Number.isInteger(millionAmount)) {
            return `$${millionAmount.toFixed(0)}M`;
        }
        else {
            return `$${millionAmount.toFixed(2)}M`;
        }
    }
    else if (amount >= 1000) {
        const thousandAmount = amount / 1000;
        if (Number.isInteger(thousandAmount)) {
            return `$${thousandAmount.toFixed(0)}k`;
        }
        else {
            return `$${thousandAmount.toFixed(1)}k`;
        }
    }
    else {
        return `$${amount.toFixed(2)}`;
    }
}
function hyperlink(link, name) {
    return "<a href='" + link + "/'> " + name + "</a>";
}
let sentMessages = {};
export function send(bot, message, groupID) {
    const key = `${groupID}:${message}`;
    if (sentMessages[key]) {
        console.log("This message has already been sent to this group in the past 30 seconds.");
        return;
    }
    bot.sendMessage(groupID, message, { parse_mode: "HTML", disable_web_page_preview: "true" });
    // Track the message as sent
    sentMessages[key] = true;
    // Delete the message from tracking after 30 seconds
    setTimeout(() => {
        delete sentMessages[key];
    }, 30000); // 30000 ms = 30 seconds
}
function shortenAddress(address) {
    return address.slice(0, 5) + ".." + address.slice(-2);
}
export async function buildTokenExchangeMessage(formattedEventData, source) {
    let { TVL, hasWETH, lastPrices0, lastPrices1, txHash, buyer, gasUsed, gasUsedWithoutTransfers, TOTAL_DOLLAR_VALUE, soldName, soldAmount, boughtName, boughtAmount, fee } = formattedEventData;
    const ADDRESS_USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const ADDRESS_WBTC = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
    const ADDRESS_WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const ADDRESS_USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    const buyerURL = getBuyerURL(buyer);
    const shortenBuyer = shortenAddress(buyer);
    const TX_HASH_URL_ETHERSCAN = getTxHashURLfromEtherscan(txHash);
    const TX_HASH_URL_TENDERLY = getTxHashURLfromTenderly(txHash);
    const TX_HASH_URL_OPENCHAIN = getTxHashURLfromOpenchain(txHash);
    if (gasUsed !== "¯⧵_(ツ)_/¯")
        gasUsed = formatForPrint(gasUsed);
    if (gasUsedWithoutTransfers !== "¯⧵_(ツ)_/¯")
        gasUsedWithoutTransfers = formatForPrint(gasUsedWithoutTransfers);
    let ethName = "ETH";
    let ethAddress;
    let ethUrl = "https://ethereum.org/669c9e2e2027310b6b3cdce6e1c52962/Ethereum_Whitepaper_-_Buterin_2014.pdf";
    if (hasWETH) {
        ethName = "WETH";
        ethAddress = ADDRESS_WETH;
        ethUrl = getTokenURL(ethAddress);
    }
    let theOtherCoinName; // either USDC or USDT
    let theOtherCoinAddress;
    if (source === "TricryptoUSDC") {
        theOtherCoinName = "USDC";
        theOtherCoinAddress = ADDRESS_USDC;
    }
    else if (source === "TricryptoUSDT") {
        theOtherCoinName = "USDT";
        theOtherCoinAddress = ADDRESS_USDT;
    }
    if (!theOtherCoinName)
        return;
    if (!theOtherCoinAddress)
        return;
    let soldWhat;
    if (soldName === "USDC") {
        soldWhat = `${formatForPrint(soldAmount)}${hyperlink(getTokenURL(theOtherCoinAddress), theOtherCoinName)}`;
    }
    else if (soldName === "WBTC") {
        soldWhat = `${formatForPrint(soldAmount)}${hyperlink(getTokenURL(ADDRESS_WBTC), "WBTC")}`;
    }
    else if (soldName === "WETH") {
        soldWhat = `${formatForPrint(soldAmount)}${hyperlink(ethUrl, ethName)}`;
    }
    let boughtWhat;
    if (boughtName === "USDC") {
        boughtWhat = `${formatForPrint(boughtAmount)}${hyperlink(getTokenURL(theOtherCoinAddress), theOtherCoinName)}`;
    }
    else if (boughtName === "WBTC") {
        boughtWhat = `${formatForPrint(boughtAmount)}${hyperlink(getTokenURL(ADDRESS_WBTC), "WBTC")}`;
    }
    else if (boughtName === "WETH") {
        boughtWhat = `${formatForPrint(boughtAmount)}${hyperlink(ethUrl, ethName)}`;
    }
    let poolName;
    let poolAddress;
    if (source === "TricryptoUSDC") {
        poolName = "TricryptoUSDC";
        poolAddress = "0x7F86Bf177Dd4F3494b841a37e810A34dD56c829B";
    }
    else if (source === "TricryptoUSDT") {
        poolName = "TricryptoUSDT";
        poolAddress = "0xf5f5B97624542D72A9E06f04804Bf81baA15e2B4";
    }
    if (!poolName)
        return;
    if (!poolAddress)
        return;
    return `
  🚀${hyperlink(buyerURL, shortenBuyer)} swapped ${soldWhat} for ${boughtWhat}${getDollarAddOn(TOTAL_DOLLAR_VALUE)}
Gas Used: ${gasUsed} | w/o Transfers: ${gasUsedWithoutTransfers}
State Prices: BTC ${formatForPrint(lastPrices0)} | ETH ${formatForPrint(lastPrices1)}
New Fee: ${formatForPrint(fee)}%
TVL: ${getDollarAddOnWithoutBrakets(TVL)}
Links:${hyperlink(getPoolURL(poolAddress), poolName)} |${hyperlink(TX_HASH_URL_ETHERSCAN, "etherscan.io")} |${hyperlink(TX_HASH_URL_OPENCHAIN, "openchain.xyz")} 🦙🦙🦙
  `;
}
export async function buildRemoveLiquidityOneMessage(formattedEventData, source) {
    let { TVL, hasWETH, lastPrices0, lastPrices1, txHash, buyer, amount, gasUsed, gasUsedWithoutTransfers, TOTAL_DOLLAR_VALUE, coinName, fee } = formattedEventData;
    const ADDRESS_USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const ADDRESS_WBTC = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
    const ADDRESS_WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const ADDRESS_USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    const buyerURL = getBuyerURL(buyer);
    const shortenBuyer = shortenAddress(buyer);
    const TX_HASH_URL_ETHERSCAN = getTxHashURLfromEtherscan(txHash);
    const TX_HASH_URL_TENDERLY = getTxHashURLfromTenderly(txHash);
    const TX_HASH_URL_OPENCHAIN = getTxHashURLfromOpenchain(txHash);
    if (gasUsed !== "¯⧵_(ツ)_/¯")
        gasUsed = formatForPrint(gasUsed);
    if (gasUsedWithoutTransfers !== "¯⧵_(ツ)_/¯")
        gasUsedWithoutTransfers = formatForPrint(gasUsedWithoutTransfers);
    let ethName = "ETH";
    let ethAddress;
    let ethUrl = "https://ethereum.org/669c9e2e2027310b6b3cdce6e1c52962/Ethereum_Whitepaper_-_Buterin_2014.pdf";
    if (hasWETH) {
        ethName = "WETH";
        ethAddress = ADDRESS_WETH;
        ethUrl = getTokenURL(ethAddress);
    }
    let theOtherCoinName; // either USDC or USDT
    let theOtherCoinAddress;
    if (source === "TricryptoUSDC") {
        theOtherCoinName = "USDC";
        theOtherCoinAddress = ADDRESS_USDC;
    }
    else if (source === "TricryptoUSDT") {
        theOtherCoinName = "USDT";
        theOtherCoinAddress = ADDRESS_USDT;
    }
    if (!theOtherCoinName)
        return;
    if (!theOtherCoinAddress)
        return;
    let removedWhat;
    if (coinName === "USDC") {
        removedWhat = `${formatForPrint(amount)}${hyperlink(getTokenURL(theOtherCoinAddress), theOtherCoinName)}`;
    }
    else if (coinName === "WBTC") {
        removedWhat = `${formatForPrint(amount)}${hyperlink(getTokenURL(ADDRESS_WBTC), "WBTC")}`;
    }
    else if (coinName === "WETH") {
        removedWhat = `${formatForPrint(amount)}${hyperlink(ethUrl, ethName)}`;
    }
    let poolName;
    let poolAddress;
    if (source === "TricryptoUSDC") {
        poolName = "TricryptoUSDC";
        poolAddress = "0x7F86Bf177Dd4F3494b841a37e810A34dD56c829B";
    }
    else if (source === "TricryptoUSDT") {
        poolName = "TricryptoUSDT";
        poolAddress = "0xf5f5B97624542D72A9E06f04804Bf81baA15e2B4";
    }
    if (!poolName)
        return;
    if (!poolAddress)
        return;
    return `
  🚀${hyperlink(buyerURL, shortenBuyer)} removed ${removedWhat}${getDollarAddOn(TOTAL_DOLLAR_VALUE)}
Gas Used: ${gasUsed} | w/o Transfers: ${gasUsedWithoutTransfers}
State Prices: BTC ${formatForPrint(lastPrices0)} | ETH ${formatForPrint(lastPrices1)}
New Fee: ${formatForPrint(fee)}%
TVL: ${getDollarAddOnWithoutBrakets(TVL)}
Links:${hyperlink(getPoolURL(poolAddress), poolName)} |${hyperlink(TX_HASH_URL_ETHERSCAN, "etherscan.io")} |${hyperlink(TX_HASH_URL_OPENCHAIN, "openchain.xyz")} 🦙🦙🦙
  `;
}
export async function buildRemoveLiquidityMessage(formattedEventData, source) {
    let { TVL, hasWETH, lastPrices0, lastPrices1, txHash, buyer, amount_usdc, amount_wbtc, amount_WETH, gasUsed, gasUsedWithoutTransfers, TOTAL_DOLLAR_VALUE, fee } = formattedEventData;
    const ADDRESS_USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const ADDRESS_WBTC = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
    const ADDRESS_WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const ADDRESS_USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    const buyerURL = getBuyerURL(buyer);
    const shortenBuyer = shortenAddress(buyer);
    const TX_HASH_URL_ETHERSCAN = getTxHashURLfromEtherscan(txHash);
    const TX_HASH_URL_TENDERLY = getTxHashURLfromTenderly(txHash);
    const TX_HASH_URL_OPENCHAIN = getTxHashURLfromOpenchain(txHash);
    if (gasUsed !== "¯⧵_(ツ)_/¯")
        gasUsed = formatForPrint(gasUsed);
    if (gasUsedWithoutTransfers !== "¯⧵_(ツ)_/¯")
        gasUsedWithoutTransfers = formatForPrint(gasUsedWithoutTransfers);
    let ethName = "ETH";
    let ethAddress;
    let ethUrl = "https://ethereum.org/669c9e2e2027310b6b3cdce6e1c52962/Ethereum_Whitepaper_-_Buterin_2014.pdf";
    if (hasWETH) {
        ethName = "WETH";
        ethAddress = ADDRESS_WETH;
        ethUrl = getTokenURL(ethAddress);
    }
    let theOtherCoinName; // either USDC or USDT
    let theOtherCoinAddress;
    if (source === "TricryptoUSDC") {
        theOtherCoinName = "USDC";
        theOtherCoinAddress = ADDRESS_USDC;
    }
    else if (source === "TricryptoUSDT") {
        theOtherCoinName = "USDT";
        theOtherCoinAddress = ADDRESS_USDT;
    }
    if (!theOtherCoinName)
        return;
    if (!theOtherCoinAddress)
        return;
    let amountUSDC = amount_usdc;
    let amountWBTC = amount_wbtc;
    let amountWETH = amount_WETH;
    let removedWhat = `${amountUSDC ? `${formatForPrint(amountUSDC)}${hyperlink(getTokenURL(theOtherCoinAddress), theOtherCoinName)} | ` : ""}${amountWBTC ? `${formatForPrint(amountWBTC)}${hyperlink(getTokenURL(ADDRESS_WBTC), "WBTC")} | ` : ""}${amountWETH ? `${formatForPrint(amountWETH)}${hyperlink(ethUrl, ethName)}` : ""}`.trim();
    // If the last character is '|', remove it
    if (removedWhat[removedWhat.length - 1] === "|") {
        removedWhat = removedWhat.slice(0, -2);
    }
    let poolName;
    let poolAddress;
    if (source === "TricryptoUSDC") {
        poolName = "TricryptoUSDC";
        poolAddress = "0x7F86Bf177Dd4F3494b841a37e810A34dD56c829B";
    }
    else if (source === "TricryptoUSDT") {
        poolName = "TricryptoUSDT";
        poolAddress = "0xf5f5B97624542D72A9E06f04804Bf81baA15e2B4";
    }
    if (!poolName)
        return;
    if (!poolAddress)
        return;
    return `
  🚀${hyperlink(buyerURL, shortenBuyer)} removed ${removedWhat}${getDollarAddOn(TOTAL_DOLLAR_VALUE)}
Gas Used: ${gasUsed} | w/o Transfers: ${gasUsedWithoutTransfers}
State Prices: BTC ${formatForPrint(lastPrices0)} | ETH ${formatForPrint(lastPrices1)}
New Fee: ${formatForPrint(fee)}%
TVL: ${getDollarAddOnWithoutBrakets(TVL)}
Links:${hyperlink(getPoolURL(poolAddress), poolName)} |${hyperlink(TX_HASH_URL_ETHERSCAN, "etherscan.io")} |${hyperlink(TX_HASH_URL_OPENCHAIN, "openchain.xyz")} 🦙🦙🦙
  `;
}
export async function buildAddLiquidityMessage(formattedEventData, source) {
    let { TVL, hasWETH, lastPrices0, lastPrices1, txHash, buyer, added_usdc, added_wbtc, added_WETH, gasUsed, gasUsedWithoutTransfers, TOTAL_DOLLAR_VALUE, fee } = formattedEventData;
    const ADDRESS_USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const ADDRESS_WBTC = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
    const ADDRESS_WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const ADDRESS_USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    const buyerURL = getBuyerURL(buyer);
    const shortenBuyer = shortenAddress(buyer);
    const TX_HASH_URL_ETHERSCAN = getTxHashURLfromEtherscan(txHash);
    const TX_HASH_URL_TENDERLY = getTxHashURLfromTenderly(txHash);
    const TX_HASH_URL_OPENCHAIN = getTxHashURLfromOpenchain(txHash);
    if (gasUsed !== "¯⧵_(ツ)_/¯")
        gasUsed = formatForPrint(gasUsed);
    if (gasUsedWithoutTransfers !== "¯⧵_(ツ)_/¯")
        gasUsedWithoutTransfers = formatForPrint(gasUsedWithoutTransfers);
    let ethName = "ETH";
    let ethAddress;
    let ethUrl = "https://ethereum.org/669c9e2e2027310b6b3cdce6e1c52962/Ethereum_Whitepaper_-_Buterin_2014.pdf";
    if (hasWETH) {
        ethName = "WETH";
        ethAddress = ADDRESS_WETH;
        ethUrl = getTokenURL(ethAddress);
    }
    let theOtherCoinName; // either USDC or USDT
    let theOtherCoinAddress;
    if (source === "TricryptoUSDC") {
        theOtherCoinName = "USDC";
        theOtherCoinAddress = ADDRESS_USDC;
    }
    else if (source === "TricryptoUSDT") {
        theOtherCoinName = "USDT";
        theOtherCoinAddress = ADDRESS_USDT;
    }
    if (!theOtherCoinName)
        return;
    if (!theOtherCoinAddress)
        return;
    let addedUSDC = added_usdc;
    let addedWBTC = added_wbtc;
    let addedWETH = added_WETH;
    let addedWhat = `${addedUSDC ? `${formatForPrint(addedUSDC)}${hyperlink(getTokenURL(theOtherCoinAddress), theOtherCoinName)} | ` : ""}${addedWBTC ? `${formatForPrint(addedWBTC)}${hyperlink(getTokenURL(ADDRESS_WBTC), "WBTC")} | ` : ""}${addedWETH ? `${formatForPrint(addedWETH)}${hyperlink(ethUrl, ethName)}` : ""}`.trim();
    // If the last character is '|', remove it
    if (addedWhat[addedWhat.length - 1] === "|") {
        addedWhat = addedWhat.slice(0, -2);
    }
    let poolName;
    let poolAddress;
    if (source === "TricryptoUSDC") {
        poolName = "TricryptoUSDC";
        poolAddress = "0x7F86Bf177Dd4F3494b841a37e810A34dD56c829B";
    }
    else if (source === "TricryptoUSDT") {
        poolName = "TricryptoUSDT";
        poolAddress = "0xf5f5B97624542D72A9E06f04804Bf81baA15e2B4";
    }
    if (!poolName)
        return;
    if (!poolAddress)
        return;
    return `
  🚀${hyperlink(buyerURL, shortenBuyer)} added ${addedWhat}${getDollarAddOn(TOTAL_DOLLAR_VALUE)}
Gas Used: ${gasUsed} | w/o Transfers: ${gasUsedWithoutTransfers}
State Prices: BTC ${formatForPrint(lastPrices0)} | ETH ${formatForPrint(lastPrices1)}
New Fee: ${formatForPrint(fee)}%
TVL: ${getDollarAddOnWithoutBrakets(TVL)}
Links:${hyperlink(getPoolURL(poolAddress), poolName)} |${hyperlink(TX_HASH_URL_ETHERSCAN, "etherscan.io")} |${hyperlink(TX_HASH_URL_OPENCHAIN, "openchain.xyz")} 🦙🦙🦙
  `;
}
export async function telegramBotMain(env, eventEmitter) {
    eventEmitter.on("newMessage", (message) => {
        if (groupID) {
            send(bot, message, parseInt(groupID));
        }
    });
    let telegramGroupToken;
    let groupID;
    if (env == "prod") {
        telegramGroupToken = process.env.TELEGRAM_Tricrypto_PROD_KEY;
        groupID = process.env.TELEGRAM_PROD_GROUP_ID;
    }
    if (env == "test") {
        telegramGroupToken = process.env.TELEGRAM_Tricrypto_TEST_KEY;
        groupID = process.env.TELEGRAM_TEST_GROUP_ID;
    }
    const bot = new TelegramBot(telegramGroupToken, { polling: true });
    bot.on("message", async (msg) => {
        if (msg.text === "bot u with us") {
            await new Promise((resolve) => setTimeout(resolve, 750));
            if (groupID) {
                bot.sendMessage(msg.chat.id, "affirmative");
            }
        }
    });
}
//# sourceMappingURL=TelegramBot.js.map