import type { ProtocolConfig, BuildActionParams, Action } from './types';

function buildAaveActions(params: BuildActionParams): Action[] {
  const { chainConfig, token, outputTokenAddress, amount, depositor } = params;

  if (token.actionType === 'ethDeposit') {
    const gateway = chainConfig.addresses.wethGateway;
    const pool = chainConfig.addresses.pool;
    return [
      {
        target: gateway,
        functionSignature:
          'function depositETH(address pool, address onBehalfOf, uint16 referralCode)',
        args: [
          { value: pool, populateDynamically: false },
          { value: depositor, populateDynamically: false },
          { value: '0', populateDynamically: false },
        ],
        value: '0',
        isNativeTransfer: false,
        populateCallValueDynamically: true,
      },
    ];
  }

  // ERC-20 supply: approve + supply
  const pool = chainConfig.addresses.pool;
  return [
    {
      target: outputTokenAddress,
      functionSignature:
        'function approve(address spender, uint256 amount)',
      args: [
        { value: pool, populateDynamically: false },
        { value: amount, populateDynamically: false },
      ],
      value: '0',
      isNativeTransfer: false,
      populateCallValueDynamically: true,
    },
    {
      target: pool,
      functionSignature:
        'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)',
      args: [
        { value: outputTokenAddress, populateDynamically: false },
        {
          value: '0',
          populateDynamically: true,
          balanceSourceToken: outputTokenAddress,
        },
        { value: depositor, populateDynamically: false },
        { value: '0', populateDynamically: false },
      ],
      value: '0',
      isNativeTransfer: false,
      populateCallValueDynamically: true,
    },
  ];
}

export const PROTOCOLS: ProtocolConfig[] = [
  {
    id: 'aave-v3',
    name: 'Aave V3',
    description: 'Supply assets to Aave V3 lending pools',
    chains: [
      {
        chainId: 1,
        chainName: 'Ethereum',
        multicallHandler: '0x924a9f036260DdD5808007E1AA95f08eD08aA569',
        addresses: {
          pool: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
          wethGateway: '0x893411580e590D62dDBca8a703d61Cc4A8c7b2b9',
        },
        tokens: [
          { symbol: 'WETH', address: null, actionType: 'ethDeposit' },
          {
            symbol: 'USDC',
            address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            actionType: 'erc20Supply',
          },
          {
            symbol: 'USDT',
            address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            actionType: 'erc20Supply',
          },
          {
            symbol: 'DAI',
            address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
            actionType: 'erc20Supply',
          },
          {
            symbol: 'WBTC',
            address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
            actionType: 'erc20Supply',
          },
        ],
      },
      {
        chainId: 42161,
        chainName: 'Arbitrum',
        multicallHandler: '0x924a9f036260DdD5808007E1AA95f08eD08aA569',
        addresses: {
          pool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
          wethGateway: '0xB5Ee21786D28c5Ba61661550879475976B707099',
        },
        tokens: [
          { symbol: 'WETH', address: null, actionType: 'ethDeposit' },
          {
            symbol: 'USDC',
            address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
            actionType: 'erc20Supply',
          },
          {
            symbol: 'USDT',
            address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
            actionType: 'erc20Supply',
          },
          {
            symbol: 'DAI',
            address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
            actionType: 'erc20Supply',
          },
          {
            symbol: 'WBTC',
            address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
            actionType: 'erc20Supply',
          },
        ],
      },
      {
        chainId: 10,
        chainName: 'Optimism',
        multicallHandler: '0x924a9f036260DdD5808007E1AA95f08eD08aA569',
        addresses: {
          pool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
          wethGateway: '0xe9E52021f4e11DEAD8661812A0A6c8627abA2a54',
        },
        tokens: [
          { symbol: 'WETH', address: null, actionType: 'ethDeposit' },
          {
            symbol: 'USDC',
            address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
            actionType: 'erc20Supply',
          },
          {
            symbol: 'USDT',
            address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
            actionType: 'erc20Supply',
          },
          {
            symbol: 'DAI',
            address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
            actionType: 'erc20Supply',
          },
          {
            symbol: 'WBTC',
            address: '0x68f180fcCe6836688e9084f035309E29Bf0A2095',
            actionType: 'erc20Supply',
          },
        ],
      },
      {
        chainId: 137,
        chainName: 'Polygon',
        multicallHandler: '0x924a9f036260DdD5808007E1AA95f08eD08aA569',
        addresses: {
          pool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
          wethGateway: '0xC09e69E79106861dF5d289dA88349f10e2dc6b5C',
        },
        tokens: [
          { symbol: 'WETH', address: null, actionType: 'ethDeposit' },
          {
            symbol: 'USDC',
            address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
            actionType: 'erc20Supply',
          },
          {
            symbol: 'USDT',
            address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
            actionType: 'erc20Supply',
          },
          {
            symbol: 'DAI',
            address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
            actionType: 'erc20Supply',
          },
          {
            symbol: 'WBTC',
            address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
            actionType: 'erc20Supply',
          },
        ],
      },
      {
        chainId: 8453,
        chainName: 'Base',
        multicallHandler: '0x0F7Ae28dE1C8532170AD4ee566B5801485c13a0E',
        addresses: {
          pool: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5',
          wethGateway: '0x8be473dCfA93132559B118a2F8e8f53E1672A45B',
        },
        tokens: [
          { symbol: 'WETH', address: null, actionType: 'ethDeposit' },
          {
            symbol: 'USDC',
            address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            actionType: 'erc20Supply',
          },
        ],
      },
    ],
    buildActions: buildAaveActions,
  },
];
