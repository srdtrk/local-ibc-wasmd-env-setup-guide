import fs from "fs";
import path from "path";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { createSigningClient } from "./createClients";
import { Secp256k1HdWallet } from "@cosmjs/amino";
import exp from "constants";

// Load environment variables
require("dotenv").config();

// Path to your contract wasm file
const contractWasmPath = path.join(
  __dirname,
  "../path-to-your-contract/contract.wasm"
);

// Upload a contract
export async function uploadWasm(
  client: SigningCosmWasmClient,
  address: string,
  contractWasmPath: string
): Promise<number> {
  // Upload the contract wasm code
  const wasm = fs.readFileSync(contractWasmPath);
  const uploadReceipt = await client.upload(address, wasm, "auto");

  // Get the contract code ID from the upload receipt
  const { codeId } = uploadReceipt;
  return codeId;
}

// Instantiate a contract
export async function instantiateContract(
  client: SigningCosmWasmClient,
  address: string,
  codeId: number,
  initMsg: any,
  label: string,
  memo?: string
): Promise<string> {
  // Create an instance of the contract
  const { contractAddress } = await client.instantiate(
    address,
    codeId,
    initMsg,
    label,
    "auto",
    { memo }
  );
  return contractAddress;
}

// Upload and instantiate a contract
export async function uploadAndInstantiateContract(
  client: SigningCosmWasmClient,
  address: string,
  contractWasmPath: string,
  initMsg: any,
  label: string,
  memo?: string
): Promise<string> {
  const codeId = await uploadWasm(client, address, contractWasmPath);
  const contractAddress = await instantiateContract(
    client,
    address,
    codeId,
    initMsg,
    label,
    memo
  );
  return contractAddress;
}
