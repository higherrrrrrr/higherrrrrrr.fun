import { defineConfig } from '@wagmi/cli'
import { foundry } from '@wagmi/cli/plugins'

export default defineConfig({
  out: 'onchain/generated.ts',
  plugins: [
    foundry({
      project: '../higherrrrrrr-protocol',
      include: ['Higherrrrrrr.sol/**', 'HigherrrrrrrFactory.sol/**'],
      deployments: {
        HigherrrrrrrFactory: {
          31337: '0x158d291D8b47F056751cfF47d1eEcd19FDF9B6f8', // Local address
          8453: '0x6F599293d4bB71750bbe7dD4D7D26780ad4c22E1' // Base mainnet address (to be filled)
        }
      },
      forge: {
        clean: true,
        build: true,
      }
    }),
  ],
}) 