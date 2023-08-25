import pDefer, { DeferredPromise } from "p-defer";
import { DataMessage, Token, TokenSchema, TransactionSchema, TransactionStateSchema, WakuObjectAdapter, WakuObjectDescriptor } from './types'
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

// const adapterFunctions = [
//   "getTransaction",
//   "getTransactionState",
//   "waitForTransaction",
//   "checkBalance",
//   "sendTransaction",
//   "estimateTransaction",
//   "updateStore",
//   "onViewChange",
// ] as const;

// type AdapterFunction = (args: string[]) => Promise<unknown>;
// type AdapterFunctions = (typeof adapterFunctions)[number];

// const generateSdk = (): Record<AdapterFunctions, AdapterFunction> => {
//   const sdk: Partial<Record<AdapterFunctions, AdapterFunction>> = {};

//   for (const name of adapterFunctions) {
//     sdk[name] = adapterFunction(name);
//   }

//   return sdk as Record<AdapterFunctions, AdapterFunction>;
// };

// // Export SDK
// export const sdk = generateSdk();

function isAdapterDataMessage(message: any): message is DataMessage {
  return typeof message == "object" && message?.type === "data"
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

const descriptorMap = new Map<string, WakuObjectDescriptor>();

export function startEventListener() {
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

    if (isAdapterDataMessage(data)) {
      const descriptor = descriptorMap.get(data.objectId)

      if (!descriptor) {
        return
      }

      if (!descriptor.onMessage) {
        return
      }

      const address = 'TODO'
      const adapter = makeWakuObjectAdapter()
      descriptor.onMessage(address, adapter, {}, () => {}, data)
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
