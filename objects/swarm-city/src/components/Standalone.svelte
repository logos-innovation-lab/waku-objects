<script lang="ts">
  // Svelte
  import { afterUpdate, onMount } from "svelte";

  // Waku Objects
  import {
    makeWakuObjectAdapter,
    makeWakuObjectContext,
    startEventListener,
  } from "@waku-objects/adapter";
  import type {
    DataMessage,
    WakuObjectArgs,
  } from "@waku-objects/adapter/dist/types";
  import Loaded from "./Loaded.svelte";

  // Waku Objects
  let args: WakuObjectArgs | undefined;
  let message: DataMessage | undefined;

  onMount(() => {
    startEventListener({
      onContextChange: async (stateProps, contextProps) => {
        const adapter = makeWakuObjectAdapter();
        const context = makeWakuObjectContext(adapter, contextProps);
        args = {
          ...context,
          ...stateProps,
        };
      },
      onDataMessage: async (message_, args_) => {
        args = args_;
        message = message_;
      },
    });
  });
</script>

{#if args}
  <Loaded />
{/if}
