import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/:path*.mdx',
        destination: '/llms.mdx/docs/:path*',
      },
    ];
  },
  async redirects() {
    return [
      // === Introduction ===
      { source: '/introduction/what-is-across', destination: '/introduction', permanent: true },
      { source: '/introduction/technical-faq', destination: '/introduction', permanent: true },

      // === Migration Guides ===
      { source: '/introduction/migration-guides', destination: '/guides/migration', permanent: true },
      { source: '/introduction/migration-guides/solana-migration-guide', destination: '/guides/migration/solana', permanent: true },
      { source: '/introduction/migration-guides/migration-from-v2-to-v3', destination: '/guides/migration/v2-to-v3', permanent: true },
      { source: '/introduction/migration-guides/migration-to-cctp', destination: '/guides/migration/cctp', permanent: true },
      { source: '/introduction/migration-guides/migration-to-cctp/migration-guide-for-relayers', destination: '/guides/migration/cctp/relayers', permanent: true },
      { source: '/introduction/migration-guides/migration-to-cctp/migration-guide-for-api-users', destination: '/guides/migration/cctp/api-users', permanent: true },
      { source: '/introduction/migration-guides/migration-guide-for-non-evm-and-prefills', destination: '/guides/migration/non-evm', permanent: true },
      { source: '/introduction/migration-guides/migration-guide-for-non-evm-and-prefills/breaking-changes-for-indexers', destination: '/guides/migration/non-evm/indexers', permanent: true },
      { source: '/introduction/migration-guides/migration-guide-for-non-evm-and-prefills/breaking-changes-for-api-users', destination: '/guides/migration/non-evm/api-users', permanent: true },
      { source: '/introduction/migration-guides/migration-guide-for-non-evm-and-prefills/breaking-changes-for-relayers', destination: '/guides/migration/non-evm/relayers', permanent: true },
      { source: '/introduction/migration-guides/migration-guide-for-non-evm-and-prefills/testnet-environment-for-migration', destination: '/guides/migration/non-evm/testnet', permanent: true },
      { source: '/introduction/migration-guides/bnb-smart-chain-migration-guide', destination: '/guides/migration/bnb', permanent: true },

      // === Developer Quickstart ===
      { source: '/developer-quickstart/introduction-to-swap-api', destination: '/introduction/swap-api', permanent: true },
      { source: '/developer-quickstart/crosschain-swap', destination: '/guides/dev-guides/integrate-swap-api', permanent: true },
      { source: '/developer-quickstart/crosschain-swap/working-with-hypercore', destination: '/introduction/hypercore', permanent: true },
      { source: '/developer-quickstart/bridge', destination: '/introduction/swap-api', permanent: true },
      { source: '/developer-quickstart/embedded-crosschain-swap-actions', destination: '/introduction/embedded-actions', permanent: true },
      { source: '/developer-quickstart/embedded-crosschain-swap-actions/transfer-erc20-tokens-after-swap', destination: '/introduction/embedded-actions/transfer-erc20', permanent: true },
      { source: '/developer-quickstart/embedded-crosschain-swap-actions/deposit-eth-into-a-defi-protocol-aave', destination: '/introduction/embedded-actions/deposit-eth-aave', permanent: true },
      { source: '/developer-quickstart/embedded-crosschain-swap-actions/add-liquidity-to-across-hubpool-with-eth', destination: '/introduction/embedded-actions/hubpool-liquidity', permanent: true },
      { source: '/developer-quickstart/embedded-crosschain-swap-actions/simple-native-eth-transfer', destination: '/introduction/embedded-actions/native-eth-transfer', permanent: true },
      { source: '/developer-quickstart/embedded-crosschain-swap-actions/handling-nested-parameters-in-the-functionsignature', destination: '/introduction/embedded-actions/nested-parameters', permanent: true },
      { source: '/developer-quickstart/erc-7683-in-production', destination: '/guides/concepts/erc-7683', permanent: true },

      // === Concepts ===
      { source: '/concepts/what-is-across-v4', destination: '/guides/concepts/across-v4', permanent: true },
      { source: '/concepts/what-are-crosschain-intents', destination: '/guides/concepts/crosschain-intents', permanent: true },
      { source: '/concepts/intents-architecture-in-across', destination: '/guides/concepts/intents-architecture', permanent: true },
      { source: '/concepts/intent-lifecycle-in-across', destination: '/guides/concepts/intent-lifecycle', permanent: true },

      // === Reference ===
      { source: '/reference/api-reference', destination: '/api-reference', permanent: true },
      { source: '/reference/app-sdk-reference', destination: '/api-reference', permanent: true },
      { source: '/reference/selected-contract-functions', destination: '/api-reference', permanent: true },
      { source: '/reference/contract-addresses', destination: '/chains-and-contracts', permanent: true },
      { source: '/reference/contract-addresses/:slug', destination: '/chains-and-contracts', permanent: true },
      { source: '/reference/supported-chains', destination: '/chains-and-contracts', permanent: true },
      { source: '/reference/fees-in-the-system', destination: '/introduction/fees', permanent: true },
      { source: '/reference/actors-in-the-system', destination: '/introduction/actors', permanent: true },
      { source: '/reference/security-model-and-verification', destination: '/introduction/security', permanent: true },
      { source: '/reference/security-model-and-verification/disputing-root-bundles', destination: '/introduction/security/disputing-root-bundles', permanent: true },
      { source: '/reference/security-model-and-verification/validating-root-bundles', destination: '/introduction/security/validating-root-bundles', permanent: true },
      { source: '/reference/tracking-events', destination: '/introduction/tracking-deposits', permanent: true },

      // === Relayers ===
      { source: '/relayers/running-a-relayer', destination: '/introduction/relayers/running-relayer', permanent: true },
      { source: '/relayers/relayer-nomination', destination: '/introduction/relayers/relayer-nomination', permanent: true },

      // === Resources (no direct equivalent) ===
      { source: '/resources/release-notes', destination: '/introduction', permanent: true },
      { source: '/resources/legacy-embedded-crosschain-actions', destination: '/introduction/embedded-actions', permanent: true },
      { source: '/resources/legacy-embedded-crosschain-actions/:slug*', destination: '/introduction/embedded-actions', permanent: true },
      { source: '/resources/support-links', destination: '/introduction', permanent: true },
      { source: '/resources/bug-bounty', destination: '/introduction', permanent: true },
      { source: '/resources/audits', destination: '/introduction/security', permanent: true },
      { source: '/resources/crosschain-live', destination: '/chains-and-contracts', permanent: true },
      { source: '/v/v3-developer-docs/introduction/what-is-across', destination: '/introduction', permanent: true },
    ];
  },
};

export default withMDX(config);
