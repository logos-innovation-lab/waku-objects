import type { Contract, Interface } from "ethers";
import z from "zod";

export interface DataMessage<T extends JSONSerializable = JSONSerializable> {
  type: "data";
  timestamp: number;
  fromAddress: string;
  objectId: string;
  instanceId: string;
  data: T;
}

export const AddressSchema = z
  .string()
  .regex(/^(0x)?[a-f0-9]{40}$/i, "Address must be 40 hex numbers");

export const TokenSchema = z.object({
  name: z.string(),
  symbol: z.string(),
  amount: z.bigint().positive(),
  decimals: z.number().int().positive(),
  image: z.string().optional(),
  address: AddressSchema.optional(),
});
export type Token = z.infer<typeof TokenSchema>;

export const UserSchema = z.object({
  address: AddressSchema,
  name: z.string().optional(),
  avatar: z.string().optional(),
});
export type User = z.infer<typeof UserSchema>;

export const TransactionSchema = z.object({
  timestamp: z.number().int().positive(),
  hash: z.string(),
  token: z.object({
    amount: z.string(),
    symbol: z.string(),
    decimals: z.number().int().positive(),
  }),
  to: AddressSchema,
  from: AddressSchema,
  fee: z.object({
    amount: z.string(),
    symbol: z.string(),
    decimals: z.number().int().positive(),
  }),
});
export type Transaction = z.infer<typeof TransactionSchema>;

export const TransactionStateSchema = z.enum([
  "unknown",
  "pending",
  "reverted",
  "success",
]);
export type TransactionState = z.infer<typeof TransactionStateSchema>;

export interface WakuObjectAdapter {
  getTransaction(txHash: string): Promise<Transaction | undefined>;
  getTransactionState(txHash: string): Promise<TransactionState>;
  waitForTransaction(txHash: string): Promise<TransactionState>;
  checkBalance(token: Token): Promise<void>;
  sendTransaction: (to: string, token: Token) => Promise<string>;
  estimateTransaction: (to: string, token: Token) => Promise<Token>;
  getContract(address: string, abi: Interface): Contract;
  rpcRequest(method: string, params: any): Promise<any>;
}

export type JSONPrimitive = string | number | boolean | null;
export type JSONObject = { [key: symbol]: JSONValue };
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface JSONArray extends Array<JSONValue> {}

export type JSONValue = JSONPrimitive | JSONObject | JSONArray;

export type JSONSerializable = JSONValue;

export interface WakuObjectState {
  readonly chatId: string;
  readonly objectId: string;
  readonly instanceId: string;
  readonly profile: User;
  readonly users: User[];
  readonly tokens: Token[];
}

type StoreType = JSONSerializable;
type DataMessageType = JSONSerializable;

export interface WakuObjectContextProps {
  readonly store?: StoreType;
  readonly view?: string;
}

export interface WakuObjectContext
  extends WakuObjectContextProps,
    WakuObjectAdapter {
  updateStore: (updater: (state?: StoreType) => StoreType) => void;

  send: (data: DataMessageType) => Promise<void>;

  onViewChange: (view: string) => void;
}

export interface WakuObjectArgs extends WakuObjectContext, WakuObjectState {}

interface WakuObjectMetadata {
  readonly objectId: string;
  readonly name: string;
  readonly description: string;
  readonly logo: string;
}

export interface WakuObjectDescriptor extends WakuObjectMetadata {
  onMessage?: (
    message: DataMessage<DataMessageType>,
    args: WakuObjectArgs
  ) => Promise<void>;
}

export type CustomArgs = {
  name: string;
};
