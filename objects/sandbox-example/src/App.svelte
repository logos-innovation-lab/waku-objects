<script lang="ts">
  import { makeWakuObjectAdapter, makeWakuObjectContext, startEventListener } from "@waku-objects/adapter"
  import type { DataMessage, WakuObjectArgs } from "@waku-objects/adapter/dist/types";
  import { afterUpdate, onMount } from "svelte";

  let args: WakuObjectArgs
  let message: DataMessage

  onMount(() => {
    startEventListener({ 
      onContextChange: async (stateProps, contextProps) => {
        const adapter = makeWakuObjectAdapter()
        const context = makeWakuObjectContext(adapter, contextProps)
        args = {
          ...context,
          ...stateProps,
        }
      },
      onDataMessage: async (message_, args_) => {
        args = args_
        message = message_
      }
    })
  })

  afterUpdate(() => {
    const { scrollWidth, scrollHeight } = document.body
    parent.postMessage(
      {
        type: 'window-size',
        scrollWidth,
        scrollHeight,
      },
      '*',
    )
  })

  async function action() {
    const adapter = makeWakuObjectAdapter()
    const context = makeWakuObjectContext(adapter)
    const transaction = await context.getTransaction('0x46593fe25fadddd0bb3feb3017b8745a471d61e5c650c3dc5c0920f46216d0b6')
    console.debug('sandbox-example: action', { transaction })
  }
</script>

<div>
  <button on:click={() => action()}>Sandbox example</button>
</div>
