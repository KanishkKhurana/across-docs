// API response types
export interface ChainInfo {
  chainId: number;
  name: string;
  logoUrl: string;
  explorerUrl: string;
  publicRpcUrl: string;
}

export interface TokenInfo {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoUrl: string;
  priceUsd: string;
}

// Action types (match Across API schema)
export interface ActionArg {
  value: string;
  populateDynamically: boolean;
  balanceSourceToken?: string;
}

export interface Action {
  target: string;
  functionSignature: string;
  args: ActionArg[];
  value: string;
  isNativeTransfer: boolean;
  populateCallValueDynamically: boolean;
}

// Protocol config (extensible pattern)
export interface ProtocolToken {
  symbol: string;
  address: string | null;
  actionType: 'ethDeposit' | 'erc20Supply';
}

export interface ProtocolChainConfig {
  chainId: number;
  chainName: string;
  multicallHandler: string;
  addresses: Record<string, string>;
  tokens: ProtocolToken[];
}

export interface ProtocolConfig {
  id: string;
  name: string;
  description: string;
  chains: ProtocolChainConfig[];
  buildActions: (params: BuildActionParams) => Action[];
}

export interface BuildActionParams {
  chainConfig: ProtocolChainConfig;
  token: ProtocolToken;
  outputTokenAddress: string;
  amount: string;
  depositor: string;
}

// Dropdown option
export interface DropdownOption {
  value: string;
  label: string;
  sublabel?: string;
  logoUrl?: string;
}

// Build result
export interface BuildResult {
  url: string;
  queryParams: Record<string, string>;
  body: Record<string, unknown>;
  curlCommand: string;
}
