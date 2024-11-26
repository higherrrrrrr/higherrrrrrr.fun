import { defineConfig } from '@wagmi/cli'
import { foundry } from '@wagmi/cli/plugins'

export default defineConfig({
  out: 'onchain/generated.ts',
  plugins: [
    foundry({
      project: '../higherrrrrrr-protocol',
      include: ['Higherrrrrrr.sol/**', 'HigherrrrrrrFactory.sol/**'],
    }),
  ],
}) 