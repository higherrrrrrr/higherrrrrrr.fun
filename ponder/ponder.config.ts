import { createConfig, factory } from "ponder";
import { http } from "viem";
import { parseAbiItem } from "abitype";
import { HigherrrrrrrFactoryAbi as HigherrrrrrrFactoryAbiV0 } from "./abis/v0/HigherrrrrrrFactory";
import { HigherrrrrrrAbi as HigherrrrrrrAbiV0 } from "./abis/v0/Higherrrrrrr";

const newTokenV0Event = parseAbiItem(
  "event NewToken(address indexed token, address indexed conviction)"
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
  },
});
