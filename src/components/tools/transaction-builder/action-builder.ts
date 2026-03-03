import type {
  BuildResult,
  TokenInfo,
  ProtocolConfig,
  ProtocolChainConfig,
  ProtocolToken,
} from './types';

interface BuildRequestParams {
  inputChainId: number;
  inputToken: TokenInfo;
  amount: string;
  protocol: ProtocolConfig;
  outputChainConfig: ProtocolChainConfig;
  outputToken: ProtocolToken;
  depositor: string;
  recipient: string;
}

function toRawAmount(amount: string, decimals: number): string {
  const parts = amount.split('.');
  const whole = parts[0] || '0';
  const fraction = (parts[1] || '').padEnd(decimals, '0').slice(0, decimals);
  const raw = whole + fraction;
  // Strip leading zeros but keep at least "0"
  return raw.replace(/^0+/, '') || '0';
}

export function buildRequest(params: BuildRequestParams): BuildResult {
  const {
    inputChainId,
    inputToken,
    amount,
    protocol,
    outputChainConfig,
    outputToken,
    depositor,
    recipient: userRecipient,
  } = params;

  // Determine output token address for the API
  // For ETH deposits, the output token is the native ETH wrapper (WETH) on the destination
  // We need to look it up from the input tokens on that chain, or use a known WETH address
  let outputTokenAddress: string;
  if (outputToken.actionType === 'ethDeposit') {
    // WETH addresses per chain
    const wethAddresses: Record<number, string> = {
      1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      42161: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      10: '0x4200000000000000000000000000000000000006',
      137: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
      8453: '0x4200000000000000000000000000000000000006',
    };
    outputTokenAddress =
      wethAddresses[outputChainConfig.chainId] ||
      '0x0000000000000000000000000000000000000000';
  } else {
    outputTokenAddress = outputToken.address!;
  }

  const rawAmount = toRawAmount(amount, inputToken.decimals);

  const actions = protocol.buildActions({
    chainConfig: outputChainConfig,
    token: outputToken,
    outputTokenAddress,
    amount: rawAmount,
    depositor: userRecipient,
  });

  const queryParams: Record<string, string> = {
    tradeType: 'exactInput',
    originChainId: String(inputChainId),
    destinationChainId: String(outputChainConfig.chainId),
    inputToken: inputToken.address,
    outputToken: outputTokenAddress,
    amount: rawAmount,
    depositor,
    recipient: outputChainConfig.multicallHandler,
  };

  const url = 'https://app.across.to/api/swap/approval';
  const queryString = new URLSearchParams(queryParams).toString();
  const fullUrl = `${url}?${queryString}`;

  const body: Record<string, unknown> = {
    actions,
  };

  const curlCommand = `curl -X POST '${fullUrl}' \\\n  -H 'Content-Type: application/json' \\\n  -d '${JSON.stringify(body)}'`;

  return { url: fullUrl, queryParams, body, curlCommand };
}
