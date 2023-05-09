# Instructions to setup an environment to test IBC Smart Contracts

## Table of Contents

- [Instructions to setup an environment to test IBC Smart Contracts](#instructions-to-setup-an-environment-to-test-ibc-smart-contracts)
  - [Table of Contents](#table-of-contents)
  - [Install Pre-requisites](#install-pre-requisites)
    - [Install golang](#install-golang)
    - [Install rust](#install-rust)
    - [Build wasmd](#build-wasmd)
    - [Install hermes](#install-hermes)
    - [Install gaiad manager](#install-gaiad-manager)
  - [Setup the environment](#setup-the-environment)
    - [Configure gaiad manager](#configure-gaiad-manager)
    - [Initialize the chains](#initialize-the-chains)
    - [Create a connection between the chains](#create-a-connection-between-the-chains)
  - [Deploy the contracts](#deploy-the-contracts)
    - [Description](#description)
    - [Build the Counter Contract](#build-the-counter-contract)
    - [Build the IBC Contracts](#build-the-ibc-contracts)

## Install Pre-requisites

In this environment setup guide, we will be using the following tools:

- [golang 1.19+](https://go.dev/)
- [rust 1.60+](https://www.rust-lang.org/)
- [wasmd](https://github.com/CosmWasm/wasmd)
- [hermes relayer](https://github.com/informalsystems/hermes)
- [Gaiad Manager](https://github.com/informalsystems/gm)

This guide doesn't use docker to set up the blockchain nodes, instead, gaiad manager takes care of managing multiple wasmd instances, and the hermes config for us.

### Install golang

Follow the instructions [here](https://golang.org/doc/install) to install golang.

### Install rust

Follow the instructions [here](https://www.rust-lang.org/tools/install) to install rust.

### Build wasmd

Navigate to a suitable directory and clone the wasmd repo, in this guide we will be using wasmd `v0.40.0-rc.1` since at this time, it is the latest version using Cosmos SDK v0.47 and ibc-go v7.

```bash
git clone https://github.com/CosmWasm/wasmd.git -b v0.40.0-rc.1
```

To build wasmd, run the following command:

```bash
cd wasmd/
make install
```

This will create the `wasmd` binary in your `$HOME/go/bin` directory. To test if the binary is working, run the following command:

```bash
wasmd version
```

You should see the following output:

```bash
0.40.0-rc.1
```

### Install hermes

Follow the instructions found in the [hermes docs](https://hermes.informal.systems/quick-start/installation.html#install-via-cargo) to install hermes via cargo.

To test if the binary is working, run the following command:

```bash
hermes version
```

You should see the following output:

```bash
hermes 1.4.1
```

If you want to install the exact same version used in this guide. You can append `--version 1.4.1` to the cargo install command.

### Install gaiad manager

Follow the instructions found in the [gaiad manager repo](https://github.com/informalsystems/gm).

## Setup the environment

In this environment, we will have two instances of wasmd running on our local machine and create a connection between them using the hermes relayer.

### Configure gaiad manager

Go to `$HOME/.gm/gm.toml` and enter the following config:

```toml
[global]
gaiad_binary="path/to/your/wasmd"
add_to_hermes=true

[global.hermes]
binary="path/to/your/hermes"

[ibc-0]
[ibc-1]
```

This config will be used to run two chains with the chain-ids `ibc-0` and `ibc-1`. If you installed hermes through cargo, you can find the binary at `$HOME/.cargo/bin/hermes`.

For more customized setups, a more in depth guide about the config can be found [here](https://hermes.informal.systems/tutorials/pre-requisites/gaiad-manager.html).

### Initialize the chains

To initialize the chains, run the following command:

```bash
gm nuke
```

Nuke command is used to stop any running nodes, delete any previous configurations (if they exist), and restart the nodes with the new configurations. If you don't have any previous configurations, you can use the `gm start` command instead.

To see if the nodes are running, run the following command:

```bash
gm status
```

You should see the following output if the nodes are running successfully:

```bash
NODE               PID    RPC   APP  GRPC  HOME_DIR
ibc-0            194371  27000 27001 27002  /path/to/.gm/ibc-0
ibc-1            194554  27010 27011 27012  /path/to/.gm/ibc-1
```

To help with the rest of the guide, we will set the following environment variables:

```bash
IBC_0="--home /path/to/your/.gm/ibc-0 --keyring-backend test"
IBC_1="--home /path/to/your/.gm/ibc-1 --keyring-backend test"
NODE_0="--node tcp://localhost:27000"
NODE_1="--node tcp://localhost:27010"
```

The ports used by the nodes are the RPC ports. We can use these variables to run commands on the nodes. For example, let's view the accounts created by gaiad manager on both the nodes:

```bash
wasmd keys list $IBC_0
wasmd keys list $IBC_1
```

You should see the following output:

```bash
- name: validator
  type: local
  address: wasm1340rxhpezg8pkw58xry006ysppr2xy4zzpma07
  pubkey: '{"@type":"/cosmos.crypto.secp256k1.PubKey","key":"AjW3R2SQJbJndP+VpemvgJj5IMTdBcKf/d7YvtMMZDKt"}'
  mnemonic: ""
- name: wallet
  type: local
  address: wasm1yddvd050tqaxhyms9udcaa3x26xl0wxj56azt5
  pubkey: '{"@type":"/cosmos.crypto.secp256k1.PubKey","key":"AkwJloSlaHxA4Ybi3/ixZn0DpbnK5s2BRPjJN/MH1fZz"}'
  mnemonic: ""
```

If at any point you want to stop the nodes and start them again later, you can use the following commands:

```bash
gm stop
gm start
```

After running `gm stop`, if you run `gm status`, you should see the following output:

```bash
NODE               PID    RPC   APP  GRPC  HOME_DIR
ibc-0                -      -     -     -  /path/to/.gm/ibc-0
ibc-1                -      -     -     -  /path/to/.gm/ibc-1
```

### Create a connection between the chains

To create a connection between the chains, we will use the hermes relayer. To do this, we will first need to create a config file and keys for hermes relayer. Gaiad manager also takes are of this for us:

```bash
gm hermes config
gm hermes keys
```

after this we can create a connection between the chains:

```bash
hermes create connection --a-chain ibc-0 --b-chain ibc-1
```

Now that light clients and connections endpoints are created in both chains. We can now open new channels on top of this connection.

The purpose of this guide is to create a channel between two smart contracts. However, we will first open a standard token transfer channel to test if the connection is working properly.

```bash
hermes create channel --a-chain ibc-0 --a-connection connection-0 --a-port transfer --b-port transfer
```

To see if the channel is created successfully, run:

```bash
hermes query channels --show-counterparty --chain ibc-0
```

and you should see the following output:

```bash
ibc-0: transfer/channel-0 --- ibc-1: transfer/channel-0
```

At this point, you can start relaying packets between the chains by running the following command on a separate terminal:

```bash
hermes start
```

Once you do this, hermes will first relay the pending packets that have not been relayed and then start passively relaying by listening for and acting on packet events. To stop relaying and stopping the chains:

- Stop Hermes by pressing `Ctrl+C`
- Stop the chains by running `gm stop`

## Deploy the contracts

### Description

In this example, we will set up a simple smart contract on `ibc-0` chain that is able to query all of the smart contracts on `ibc-1` chain through IBC. Since channels can only be opened between two smart contracts, we will deploy a query receiver contract on `ibc-1`. Then, we will open a channel between this contract and the querier contract of `ibc-0`. For this tutorial, we will use the querier and query receiver contracts from [this repository](https://github.com/JakeHartnell/cw-ibc-queries).

And to have some contract to query on `ibc-1`, we will deploy the template counter contract from [here](https://github.com/CosmWasm/cw-template.git).

These queries are unlike the queries that are made between smart contracts that reside in the same blockchain. A callback transaction will have to be made from the query receiver to the querier. In this model, there is no difference between an ibc query and an ibc transaction. The only difference is that the query receiver will have to send a callback transaction to the querier.

### Build the Counter Contract

First, we will build the counter contract. In an appropriate directory, run the following command:

```bash
cargo generate --git https://github.com/CosmWasm/cw-template.git --name counter-contract
```

Then follow the building instruction in `Developing.md`. Build with the rust optimizer docker image to reduce the size of the contract and make the build more reproducible. At the time of writing, the recommended build command is:

```bash
docker run --rm -v "$(pwd)":/code \
  --mount type=volume,source="$(basename "$(pwd)")_cache",target=/code/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/rust-optimizer:0.12.11
```

The contract can be found in `./artifacts/`.

### Build the IBC Contracts

Now, we will build the query receiver contract. In an appropriate directory, run the following command:

```bash
git clone https://github.com/JakeHartnell/cw-ibc-queries.git
cd cw-ibc-queries/
```

Note that this repository is built as a mono workspace. So building each contract individually is not recommended and is difficult. Even if you tried running the optimizer command from above in each of the contracts found in `./contracts/`, this would fail. You should build all contracts and packages in this repo at once. So we will need to use the workspace optimizer docker image instead. You can learn more about contracts as workspace members [here](https://github.com/CosmWasm/rust-optimizer#contracts-as-workspace-members). Run:

```bash
docker run --rm -v "$(pwd)":/code \
  --mount type=volume,source="$(basename "$(pwd)")_cache",target=/code/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/workspace-optimizer:0.12.13
```

The contracts can be found in `./artifacts/`.
