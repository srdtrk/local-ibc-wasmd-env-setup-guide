import {
  CosmWasmClient,
  SigningCosmWasmClient,
} from "@cosmjs/cosmwasm-stargate";
import { Secp256k1HdWallet } from "@cosmjs/amino";

// Create a read-only client
export async function createReadOnlyClient(
  rpcEndpoint: string
): Promise<CosmWasmClient> {
  const client = CosmWasmClient.connect(rpcEndpoint);
  console.log("Read-only client has been created:", client);
  return client;
}

// Create a signing client
export async function createSigningClient(
  rpcEndpoint: string,
  mnemonic: string
): Promise<SigningCosmWasmClient> {
  const wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic);
  const client = SigningCosmWasmClient.connectWithSigner(rpcEndpoint, wallet);
  console.log("Signing client has been created:", client);
  return client;
}
