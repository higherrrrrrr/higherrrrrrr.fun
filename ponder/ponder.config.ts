import { createConfig, factory } from "ponder";
import { http } from "viem";
import { parseAbiItem } from "abitype";
import { HigherrrrrrrFactoryAbi as HigherrrrrrrFactoryAbiV0 } from "./abis/v0/HigherrrrrrrFactory";
import { HigherrrrrrrAbi as HigherrrrrrrAbiV0 } from "./abis/v0/Higherrrrrrr";
import { HigherrrrrrrConvictionAbi as HigherrrrrrrConvictionAbiV0 } from "./abis/v0/HigherrrrrrrConviction";
import { HigherrrrrrrFactoryAbi as HigherrrrrrrFactoryAbiV1 } from "./abis/v1/HigherrrrrrrFactory";
import { HigherrrrrrrAbi as HigherrrrrrrAbiV1 } from "./abis/v1/Higherrrrrrr";
import { HigherrrrrrrConvictionAbi as HigherrrrrrrConvictionAbiV1 } from "./abis/v1/HigherrrrrrrConviction";

const newTokenV0Event = parseAbiItem(
  "event NewToken(address indexed token, address indexed conviction)"
);

const newTokenV1Event = parseAbiItem(
  "event NewToken(address indexed token, address indexed conviction, string name, string symbol, uint8 marketType)"
);

const HIGHERRRRRRR_FACTORY_V0_ADDRESS = process.env
  .HIGHERRRRRRR_FACTORY_V0_ADDRESS as `0x${string}`;
if (!HIGHERRRRRRR_FACTORY_V0_ADDRESS) {
  throw new Error("HIGHERRRRRRR_FACTORY_V0_ADDRESS is not set");
}

const HIGHERRRRRRR_FACTORY_V0_INDEXING_START_BLOCK = parseInt(
  process.env.HIGHERRRRRRR_FACTORY_V0_INDEXING_START_BLOCK ?? "",
  10
);
if (
  isNaN(HIGHERRRRRRR_FACTORY_V0_INDEXING_START_BLOCK) ||
  !HIGHERRRRRRR_FACTORY_V0_INDEXING_START_BLOCK
) {
  throw new Error("HIGHERRRRRRR_FACTORY_V0_INDEXING_START_BLOCK is not set");
}

const HIGHERRRRRRR_V0_INDEXING_START_BLOCK = parseInt(
  process.env.HIGHERRRRRRR_V0_INDEXING_START_BLOCK ?? "",
  10
);
if (
  isNaN(HIGHERRRRRRR_V0_INDEXING_START_BLOCK) ||
  !HIGHERRRRRRR_V0_INDEXING_START_BLOCK
) {
  throw new Error("HIGHERRRRRRR_V0_INDEXING_START_BLOCK is not set");
}

const HIGHERRRRRRR_FACTORY_V1_ADDRESS = process.env
  .HIGHERRRRRRR_FACTORY_V1_ADDRESS as `0x${string}`;
if (!HIGHERRRRRRR_FACTORY_V1_ADDRESS) {
  throw new Error("HIGHERRRRRRR_FACTORY_V1_ADDRESS is not set");
}

const HIGHERRRRRRR_FACTORY_V1_INDEXING_START_BLOCK = parseInt(
  process.env.HIGHERRRRRRR_FACTORY_V1_INDEXING_START_BLOCK ?? "",
  10
);
if (
  isNaN(HIGHERRRRRRR_FACTORY_V1_INDEXING_START_BLOCK) ||
  !HIGHERRRRRRR_FACTORY_V1_INDEXING_START_BLOCK
) {
  throw new Error("HIGHERRRRRRR_FACTORY_V0_INDEXING_START_BLOCK is not set");
}

const HIGHERRRRRRR_V1_INDEXING_START_BLOCK = parseInt(
  process.env.HIGHERRRRRRR_V1_INDEXING_START_BLOCK ?? "",
  10
);
if (
  isNaN(HIGHERRRRRRR_V1_INDEXING_START_BLOCK) ||
  !HIGHERRRRRRR_V1_INDEXING_START_BLOCK
) {
  throw new Error("HIGHERRRRRRR_V1_INDEXING_START_BLOCK is not set");
}

export default createConfig({
  networks: {
    base: {
      chainId: 8453,
      transport: http(process.env.PONDER_RPC_URL_8453),
    },
  },
  contracts: {
    HigherrrrrrrFactoryV0: {
      network: "base",
      abi: HigherrrrrrrFactoryAbiV0,
      address: HIGHERRRRRRR_FACTORY_V0_ADDRESS,
      startBlock: HIGHERRRRRRR_FACTORY_V0_INDEXING_START_BLOCK,
    },
    HigherrrrrrrV0: {
      network: "base",
      abi: HigherrrrrrrAbiV0,
      address: factory({
        address: HIGHERRRRRRR_FACTORY_V0_ADDRESS,
        event: newTokenV0Event,
        parameter: "token",
      }),
      startBlock: HIGHERRRRRRR_V0_INDEXING_START_BLOCK,
    },
    HigherrrrrrrConvictionV0: {
      network: "base",
      abi: HigherrrrrrrConvictionAbiV0,
      address: factory({
        address: HIGHERRRRRRR_FACTORY_V0_ADDRESS,
        event: newTokenV0Event,
        parameter: "conviction",
      }),
      startBlock: HIGHERRRRRRR_V0_INDEXING_START_BLOCK,
    },
    HigherrrrrrrFactoryV1: {
      network: "base",
      abi: HigherrrrrrrFactoryAbiV1,
      address: HIGHERRRRRRR_FACTORY_V1_ADDRESS,
      startBlock: HIGHERRRRRRR_FACTORY_V1_INDEXING_START_BLOCK,
    },
    HigherrrrrrrV1: {
      network: "base",
      abi: HigherrrrrrrAbiV1,
      address: factory({
        address: HIGHERRRRRRR_FACTORY_V1_ADDRESS,
        event: newTokenV1Event,
        parameter: "token",
      }),
      startBlock: HIGHERRRRRRR_V1_INDEXING_START_BLOCK,
    },
    HigherrrrrrrConvictionV1: {
      network: "base",
      abi: HigherrrrrrrConvictionAbiV1,
      address: factory({
        address: HIGHERRRRRRR_FACTORY_V1_ADDRESS,
        event: newTokenV1Event,
        parameter: "conviction",
      }),
      startBlock: HIGHERRRRRRR_V1_INDEXING_START_BLOCK,
    },
  },
});
