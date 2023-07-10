<script lang="ts">
  import { onMount } from "svelte";
  import { getDefaultProvider, ZeroAddress } from "ethers";

  let balance: bigint | undefined;
  const provider = getDefaultProvider("https://rpc.gnosischain.com/");

  onMount(async () => {
    balance = await provider.getBalance(ZeroAddress);
  });
</script>

<div>Balance: {balance}</div>
