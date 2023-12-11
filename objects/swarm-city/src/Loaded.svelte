<script lang="ts">
  // Svelte
  import { onMount } from "svelte";

  // View
  import {
    createPublicClient,
    createWalletClient,
    custom,
    type Hex,
  } from "viem";
  import { gnosis } from "viem/chains";

  // Waku Objects
  import { makeWakuObjectAdapter } from "@waku-objects/adapter";
  import { updateSize } from "./lib/window";

  let account: Hex | undefined;
  let chainId: number | undefined;
  let hash: Hex | undefined;

  // Viem
  const transport = custom({
    async request({ method, params }) {
      const adapter = makeWakuObjectAdapter();
      return await adapter.rpcRequest(method, params);
    },
  });

  // This could also use a local RPC
  const client = createPublicClient({
    chain: gnosis,
    transport,
  });

  const wallet = createWalletClient({
    chain: gnosis,
    transport,
  });

  let blockNumber: bigint | null = null;

  onMount(() => {
    client.watchBlockNumber({
      onBlockNumber: (number) => {
        blockNumber = number;
      },
    });

    wallet.getAddresses().then((accounts) => (account = accounts[0]));
    wallet.getChainId().then((_chainId) => (chainId = _chainId));
  });

  const sendNativeTokens = async () => {
    if (!account || !chainId) {
      return;
    }

    hash = undefined;
    setTimeout(updateSize, 1);

    hash = await wallet.sendTransaction({
      account,
      to: account,
      value: 1n,
    });
    setTimeout(updateSize, 1);
  };
</script>

<div>{blockNumber}</div>

{#if account}
  <div>{account}</div>
  <button on:click={sendNativeTokens}>Send one wei to myself</button>
{/if}

{#if hash}
  <div>Hash: {hash}</div>
{/if}
