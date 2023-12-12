<script lang="ts">
  // Svelte
  import { onMount } from "svelte";

  // View
  import { type Hex } from "viem";

  // Waku Objects
  import { updateSize } from "./lib/window";
  import { client, wallet } from "./lib/viem";
  import {
    getMarketplaceList,
    type MarketplaceListResult,
  } from "./lib/services/marketplace-list";

  let account: Hex | undefined;
  let chainId: number | undefined;
  let hash: Hex | undefined;
  let blockNumber: bigint | null = null;
  let list: MarketplaceListResult | undefined;

  onMount(() => {
    client.watchBlockNumber({
      onBlockNumber: (number) => {
        blockNumber = number;
      },
    });

    wallet.getAddresses().then((accounts) => (account = accounts[0]));
    wallet.getChainId().then((_chainId) => (chainId = _chainId));

    getMarketplaceList(
      "0x72FdB3f1B2A70F4B969864D0B7EcB246B4Ba5F7F",
      28289079n
    ).then((_list) => {
      list = _list;
      setTimeout(updateSize, 1);
    });
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

{#if list?.marketplaces && Object.entries(list.marketplaces).length}
  <ul>
    {#each Object.values(list.marketplaces) as marketplace}
      <li>{marketplace.name}</li>
    {/each}
  </ul>
{/if}
