import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { TokenChecker } from '@/components/tools/token-checker';
import { ChainChecker } from '@/components/tools/chain-checker';
import { StatusTracker } from '@/components/tools/status-tracker';
import { ToolCards } from '@/components/tools/tool-cards';
import { TransactionBuilder } from '@/components/tools/transaction-builder';
import { APIPage } from '@/components/api-page';
import { ChainsAndContracts } from '@/components/chains-and-contracts';
import { APICards } from '@/components/api-cards';

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    TokenChecker,
    ChainChecker,
    StatusTracker,
    ToolCards,
    TransactionBuilder,
    APIPage,
    ChainsAndContracts,
    APICards,
    ...components,
  };
}
