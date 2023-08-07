import pDefer, { DeferredPromise } from "p-defer";

// Store
const promiseMap = new Map<string, DeferredPromise<unknown>>();

// NOTE: Probably good enough?
const generateRandomValue = (): string => {
  return Math.random().toString();
};

const adapterFunction = (name: string) => (args: unknown[]) => {
  const id = generateRandomValue();
  const defer = pDefer();

  // Post message to parent
  parent.postMessage({
    type: "adapter",
    function: name,
    args,
    id,
  });

  // Map deferred promise to id
  promiseMap.set(id, defer);

  // Return promise
  return defer.promise;
};

const adapterFunctions = [
  "getTransaction",
  "getTransactionState",
  "waitForTransaction",
  "checkBalance",
  "sendTransaction",
  "estimateTransaction",
  "updateStore",
  "onViewChange",
] as const;

type AdapterFunction = (args: unknown[]) => Promise<unknown>;
type AdapterFunctions = (typeof adapterFunctions)[number];
type AdapterMessage = {
  type: "adapter";
  name: string;
  id: string;
  result: unknown;
};

const generateSdk = (): Record<AdapterFunctions, AdapterFunction> => {
  const sdk: Partial<Record<AdapterFunctions, AdapterFunction>> = {};

  for (const name of adapterFunctions) {
    sdk[name] = adapterFunction(name);
  }

  return sdk as Record<AdapterFunctions, AdapterFunction>;
};

const isAdapterMessage = (message: any): message is AdapterMessage => {
  return typeof message == "object" && message?.type === "adapter";
};

// Export SDK
export const sdk = generateSdk();

// Start listener
window.addEventListener("message", (event) => {
  // Check if the message came from the parent (chat app)
  /*
  if (event.origin !== "null" || event.source !== parent.contentWindow) {
    return;
  }
  */

  const { data } = event;
  if (!isAdapterMessage(data)) {
    return;
  }

  const defer = promiseMap.get(data.id);
  if (!defer) {
    throw new Error("Deferred Promise not found");
  }

  defer.resolve(data.result);
});
