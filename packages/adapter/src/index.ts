import pDefer, { DeferredPromise } from "p-defer";
import { DataMessage, JSONSerializable, Token, TokenSchema, TransactionSchema, TransactionStateSchema, WakuObjectAdapter, WakuObjectArgs, WakuObjectContext, WakuObjectState } from './types'
import { Contract } from "ethers";

interface AdapterRequestMessage {
  type: 'adapter'
  function: string
  id: string
  args: string[]
}

interface AdapterResponseMessage {
  type: 'adapter',
  id: string
  result: unknown
}

export interface IframeDataMessage {
	type: 'iframe-data-message'
	message: DataMessage
  state: WakuObjectState
}

export interface IframeStartMessage {
  type: 'iframe-start-message'
  state: WakuObjectState
}

// Store
const promiseMap = new Map<string, DeferredPromise<unknown>>();

// NOTE: Probably good enough?
const generateRandomValue = (): string => {
  return Math.random().toString();
};

const adapterFunction = (name: string) => (...args: string[]) => {
  const id = generateRandomValue();
  const defer = pDefer();

  const message: AdapterRequestMessage = {
    type: "adapter",
    function: name,
    id,
    args,
  }

  // Post message to parent
  // TODO replace targetOrigin
  parent.postMessage(message, { targetOrigin: 'http://127.0.0.1:5173'});

  // Map deferred promise to id
  promiseMap.set(id, defer);

  // Return promise
  return defer.promise;
};

function isIframeDataMessage(message: any): message is IframeDataMessage {
  return typeof message == "object" && message?.type === "iframe-data-message"
}

const isAdapterResponseMessage = (message: any): message is AdapterResponseMessage => {
  return typeof message == "object" && message?.type === "adapter" && typeof message?.id === 'string';
};


export function makeWakuObjectAdapter(): WakuObjectAdapter {
  async function getTransaction(txHash: string) {
    const response = await adapterFunction('getTransaction')(txHash)
    if (!response) {
      return
    }

    const result = TransactionSchema.safeParse(response)
    if (!result.success) {
      return
    }

    return result.data
  }

  async function getTransactionState(txHash: string) {
    const response = await adapterFunction('getTransactionState')(txHash)
    if (!response) {
      throw 'invalid response'
    }

    const result = TransactionStateSchema.safeParse(response)
    if (!result.success) {
      throw 'invalid response'
    }

    return result.data
  }

  async function waitForTransaction(txHash: string) {
    const response = await adapterFunction('waitForTransaction')(txHash)
    if (!response) {
      throw 'invalid response'
    }

    const result = TransactionStateSchema.safeParse(response)
    if (!result.success) {
      throw 'invalid response'
    }

    return result.data
  }

  async function checkBalance(token: Token) {
    await adapterFunction('checkBalance')(JSON.stringify(token))
  }

  async function sendTransaction(to: string, token: Token) {
    const response = await adapterFunction('sendTransaction')(to, JSON.stringify(token))
    if (!response) {
      throw 'invalid response'
    }

    if (typeof response !== 'string') {
      throw 'invalid response'
    }

    return response
  }

  async function estimateTransaction(to: string, token: Token) {
    const response = await adapterFunction('sendTransaction')(to, JSON.stringify(token))
    if (!response) {
      throw 'invalid response'
    }

    const result = TokenSchema.safeParse(response)
    if (!result.success) {
      throw 'invalid response'
    }

    return result.data
  }

  function getContract(): Contract {
    throw 'not implemented'
  }

  return {
    getTransaction,
    getTransactionState,
    waitForTransaction,
    checkBalance,
    sendTransaction,
    estimateTransaction,
    getContract,
  }
}

export function makeWakuObjectContext(adapter: WakuObjectAdapter): WakuObjectContext {
  async function send(data: JSONSerializable) {
    const response = await adapterFunction('send')(JSON.stringify(data))
    if (!response) {
      throw 'invalid response'
    }
  }

  async function updateStore() {
    throw 'not implemented'
  }

  function onViewChange() {
    throw 'not implemented'    
  }

  return {
    ...adapter,
    send,
    updateStore,
    onViewChange,
  }
}

interface EventListenerOptions {
  onDataMessage: (dataMessage: DataMessage, args: WakuObjectArgs) => Promise<void>
}

export function startEventListener(options: Partial<EventListenerOptions>) {
  // Start listener
  window.addEventListener("message", (event) => {
    console.debug('adapter sdk', { event })
    // Check if the message came from the parent (chat app)
    /*
    if (event.origin !== "null" || event.source !== parent.contentWindow) {
      return;
    }
    */

    const { data } = event;

    if (isIframeDataMessage(data)) {
      const message = data.message as DataMessage
      const adapter = makeWakuObjectAdapter()
      const context = makeWakuObjectContext(adapter)
      const args: WakuObjectArgs = {
        ...context,
        ...data.state
      }
      if (options.onDataMessage) {
        options.onDataMessage(message, args)
      }
      return
    }

    if (!isAdapterResponseMessage(data)) {
      return;
    }

    const defer = promiseMap.get(data.id);
    if (!defer) {
      throw new Error("Deferred Promise not found");
    }

    promiseMap.delete(data.id)

    defer.resolve(data.result);
  });

}
