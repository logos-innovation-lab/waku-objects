<script lang="ts">
  import { onMount } from "svelte";
  import { getDefaultProvider, ZeroAddress } from "ethers";

  let balance;
  const provider = getDefaultProvider("https://rpc.gnosischain.com/");

  parent.postMessage("event", "*");

  localStorage.setItem("test", "blabla");

  onMount(async () => {
    balance = await provider.getBalance(ZeroAddress);
  });
</script>

<div>Balance: {balance}</div>
