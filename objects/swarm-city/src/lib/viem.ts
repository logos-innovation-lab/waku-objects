import { createPublicClient, createWalletClient, custom } from "viem";
import { makeWakuObjectAdapter } from "@waku-objects/adapter";

// Lib
import { gnosis } from "viem/chains";

// Viem
const transport = custom({
  async request({ method, params }) {
    const adapter = makeWakuObjectAdapter();
    return await adapter.rpcRequest(method, params);
  },
});

// This could also use a local RPC
export const client = createPublicClient({
  chain: gnosis,
  transport,
});

export const wallet = createWalletClient({
  chain: gnosis,
  transport,
});
