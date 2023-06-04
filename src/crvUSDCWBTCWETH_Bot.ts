import fs from "fs";
import { getWeb3WsProvider } from "./utils/helperFunctions/Web3.js";
import { getPastEvents, subscribeToEvents } from "./utils/web3Calls/generic.js";
import { buildAddLiquidityMessage, buildRemoveLiquidityMessage, buildRemoveLiquidityOneMessage, telegramBotMain } from "./utils/telegram/TelegramBot.js";
import { processTokenExchangeEvent, processAddLiquidityEvent, processRemoveLiquidityEvent, processRemoveLiquidityOneEvent } from "./utils/helperFunctions/Decoding.js";
import { buildTokenExchangeMessage } from "./utils/telegram/TelegramBot.js";
import { EventEmitter } from "events";

console.clear();

const ENV = "prod";
// const ENV = "test";

const eventEmitter = new EventEmitter();

async function main() {
  await telegramBotMain(ENV, eventEmitter);

  const WEB3_WS_PROVIDER = getWeb3WsProvider();

  const ADDRESS_TRICRYPTOUSDC = "0x7F86Bf177Dd4F3494b841a37e810A34dD56c829B";
  const ABI_TRICRYPTOUSDC_RAW = fs.readFileSync("../JSONs/NEWTRICRYPTOAbi.json", "utf8");
  const ABI_TRICRYPTOUSDC = JSON.parse(ABI_TRICRYPTOUSDC_RAW);
  const TRICRYPTOUSDC = new WEB3_WS_PROVIDER.eth.Contract(ABI_TRICRYPTOUSDC, ADDRESS_TRICRYPTOUSDC);

  const ADDRESS_NEWER_TRICRYPTO = "0xf5f5B97624542D72A9E06f04804Bf81baA15e2B4";
  const TRICRYPTOUSDT = new WEB3_WS_PROVIDER.eth.Contract(ABI_TRICRYPTOUSDC, ADDRESS_NEWER_TRICRYPTO);

  //////////////////////// HISTO MODE ////////////////////////
  /*
  const START_BLOCK = 17403135;
  const END_BLOCK = 17403311;

  // const START_BLOCK = 17401186;
  // const END_BLOCK = 17401186;

  const PAST_EVENTS_NEW_RAW = await getPastEvents(TRICRYPTOUSDC, "allEvents", START_BLOCK, END_BLOCK);
  const PAST_EVENTS_NEW = Array.isArray(PAST_EVENTS_NEW_RAW) ? PAST_EVENTS_NEW_RAW.map((event) => ({ ...event, source: "TricryptoUSDC" })) : [];

  const PAST_EVENTS_NEWER_RAW = await getPastEvents(TRICRYPTOUSDT, "allEvents", START_BLOCK, END_BLOCK);
  const PAST_EVENTS_NEWER = Array.isArray(PAST_EVENTS_NEWER_RAW) ? PAST_EVENTS_NEWER_RAW.map((event) => ({ ...event, source: "TricryptoUSDT" })) : [];

  const PAST_EVENTS = [...PAST_EVENTS_NEW, ...PAST_EVENTS_NEWER];

  if (!(PAST_EVENTS_NEW instanceof Array)) return;

  type ExtendedEvent = { event: string; source: string };

  for (const EVENT of PAST_EVENTS as ExtendedEvent[]) {
    if (EVENT.event === "AddLiquidity") {
      const formattedEventData = await processAddLiquidityEvent(EVENT, EVENT.source);
      if (!formattedEventData) return;
      // console.log(formattedEventData);
      if (Object.values(formattedEventData).some((value) => value === undefined)) continue;
      const message = await buildAddLiquidityMessage(formattedEventData, EVENT.source);
      eventEmitter.emit("newMessage", message);
    } else if ((EVENT as { event: string }).event === "RemoveLiquidity") {
      const formattedEventData = await processRemoveLiquidityEvent(EVENT, EVENT.source);
      if (!formattedEventData) return;
      // console.log(formattedEventData);
      if (Object.values(formattedEventData).some((value) => value === undefined)) continue;
      const message = await buildRemoveLiquidityMessage(formattedEventData, EVENT.source);
      eventEmitter.emit("newMessage", message);
    } else if ((EVENT as { event: string }).event === "RemoveLiquidityOne") {
      const formattedEventData = await processRemoveLiquidityOneEvent(EVENT, EVENT.source);
      if (!formattedEventData) return;
      // console.log(formattedEventData);
      if (Object.values(formattedEventData).some((value) => value === undefined)) continue;
      const message = await buildRemoveLiquidityOneMessage(formattedEventData, EVENT.source);
      eventEmitter.emit("newMessage", message);
    } else if ((EVENT as { event: string }).event === "TokenExchange") {
      const formattedEventData = await processTokenExchangeEvent(EVENT, EVENT.source);
      if (!formattedEventData) return;
      // console.log(formattedEventData);
      if (Object.values(formattedEventData).some((value) => value === undefined)) continue;
      const message = await buildTokenExchangeMessage(formattedEventData, EVENT.source);
      eventEmitter.emit("newMessage", message);
    }
  }
  */
  ////////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////////////

  //////////////////////// LIVE MODE ////////////////////////

  await subscribeToEvents(TRICRYPTOUSDC, "TricryptoUSDC", eventEmitter);
  await subscribeToEvents(TRICRYPTOUSDT, "TricryptoUSDT", eventEmitter);
  eventEmitter.on("newEvent", async (EVENT: any) => {
    console.log("New Event picked up by the Emitter:", EVENT);
    // CONTROLLER EVENTS
    if (EVENT.event === "AddLiquidity") {
      const formattedEventData = await processAddLiquidityEvent(EVENT, EVENT.source);
      if (!formattedEventData) return;
      console.log(formattedEventData);
      if (Object.values(formattedEventData).some((value) => value === undefined)) return;
      const message = await buildAddLiquidityMessage(formattedEventData, EVENT.source);
      eventEmitter.emit("newMessage", message);
    } else if (EVENT.event === "RemoveLiquidity") {
      const formattedEventData = await processRemoveLiquidityEvent(EVENT, EVENT.source);
      if (!formattedEventData) return;
      console.log(formattedEventData);
      if (Object.values(formattedEventData).some((value) => value === undefined)) return;
      const message = await buildRemoveLiquidityMessage(formattedEventData, EVENT.source);
      eventEmitter.emit("newMessage", message);
    } else if (EVENT.event === "RemoveLiquidityOne") {
      const formattedEventData = await processRemoveLiquidityOneEvent(EVENT, EVENT.source);
      if (!formattedEventData) return;
      console.log(formattedEventData);
      if (Object.values(formattedEventData).some((value) => value === undefined)) return;
      const message = await buildRemoveLiquidityOneMessage(formattedEventData, EVENT.source);
      eventEmitter.emit("newMessage", message);
    } else if (EVENT.event === "TokenExchange") {
      const formattedEventData = await processTokenExchangeEvent(EVENT, EVENT.source);
      if (!formattedEventData) return;
      console.log(formattedEventData);
      if (Object.values(formattedEventData).some((value) => value === undefined)) return;
      const message = await buildTokenExchangeMessage(formattedEventData, EVENT.source);
      eventEmitter.emit("newMessage", message);
    }
  });
  console.log("crvUSDCWBTCWETH_Bot launched successfully.");
}

await main();
