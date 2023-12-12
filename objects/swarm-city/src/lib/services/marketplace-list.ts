import { parseAbi, type Hex } from "viem";

// Lib
import { shouldUpdate } from "../blockchain";
import { client } from "../viem";

export type MarketplaceListItem = {
  address: string;
  name: string;
  blockNumber: bigint;
  transactionIndex: number;
  deleted?: boolean;
};

export type MarketplaceList = Record<string, MarketplaceListItem>;

export type MarketplaceListResult = {
  marketplaces: MarketplaceList;
  lastBlock: bigint | undefined;
};

export const getMarketplaceList = async (
  address: Hex,
  fromBlock?: bigint
): Promise<MarketplaceListResult> => {
  const marketplaces: MarketplaceList = {};
  const events = await client.getLogs({
    address,
    events: parseAbi([
      "event MarketplaceAdded(address indexed addr, string name)",
      "event MarketplaceRemoved(address indexed addr)",
    ]),
    fromBlock,
    strict: true,
  });

  console.log(events);

  let lastBlock = fromBlock;

  for (const event of events) {
    const { args, eventName, blockNumber, transactionIndex } = event;
    const { addr: address } = args;

    if (!shouldUpdate(event, marketplaces[address])) {
      continue;
    }

    switch (eventName) {
      case "MarketplaceAdded":
        marketplaces[address] = {
          name: args.name,
          address,
          blockNumber,
          transactionIndex,
        };
        break;

      case "MarketplaceRemoved":
        if (marketplaces[address]) {
          marketplaces[address].deleted = true;
        }
        break;
    }

    lastBlock = event.blockNumber;
  }

  console.log({ marketplaces, lastBlock });

  return { marketplaces, lastBlock };
};
