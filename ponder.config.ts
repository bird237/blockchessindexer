import { createConfig, factory } from "ponder";
import { parseAbiItem } from "viem";

import { ChessGameFactoryAbi } from "./abis/ChessGameFactoryAbi";
import { ChessGameTableAbi } from "./abis/ChessGameTableAbi";
import { ChessEloRegistryAbi } from "./abis/ChessEloRegistryAbi";

const factoryAddress = (process.env.FACTORY_ADDRESS ??
  "0x0000000000000000000000000000000000000000") as `0x${string}`;
const eloRegistryAddress = (process.env.ELO_REGISTRY_ADDRESS ??
  "0x0000000000000000000000000000000000000000") as `0x${string}`;
const startBlock = Number(process.env.START_BLOCK ?? 0);

export default createConfig({
  chains: {
    polygon: {
      id: 137,
      rpc: process.env.PONDER_RPC_URL_POLYGON ?? "http://127.0.0.1:8545",
    },
  },
  contracts: {
    ChessGameFactory: {
      chain: "polygon",
      abi: ChessGameFactoryAbi,
      address: factoryAddress,
      startBlock,
    },
    ChessGameTable: {
      chain: "polygon",
      abi: ChessGameTableAbi,
      address: factory({
        address: factoryAddress,
        event: parseAbiItem(
          "event TableCreated(address indexed table, uint8 mode, address indexed creator, address frontendRecipient)",
        ),
        parameter: "table",
      }),
      startBlock,
    },
    // Independent, single fixed-address contract -- not deployed
    // per-table via the factory, so no `factory({...})` address resolution.
    ChessEloRegistry: {
      chain: "polygon",
      abi: ChessEloRegistryAbi,
      address: eloRegistryAddress,
      startBlock,
    },
  },
});
