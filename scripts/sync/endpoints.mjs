/**
 * Declarative config for each API endpoint.
 *
 * Each entry defines:
 * - method/path: HTTP method and path
 * - calls: array of param sets to call (multiple = more field coverage)
 * - schemaPath: JSON-pointer-like path to the 200 response schema in the YAML
 *               (null = schema is missing, needs to be created)
 * - usesRef: whether the existing schema uses $ref (vs inline)
 */
export const endpoints = [
  {
    name: 'GET /swap/chains',
    method: 'GET',
    path: '/swap/chains',
    calls: [{}],
    schemaPath:
      'paths./swap/chains.get.responses.200.content.application/json.schema',
    usesRef: false,
  },
  {
    name: 'GET /swap/tokens',
    method: 'GET',
    path: '/swap/tokens',
    calls: [{}],
    schemaPath:
      'paths./swap/tokens.get.responses.200.content.application/json.schema',
    usesRef: false,
  },
  {
    name: 'GET /swap/sources',
    method: 'GET',
    path: '/swap/sources',
    calls: [{}],
    schemaPath:
      'paths./swap/sources.get.responses.200.content.application/json.schema',
    usesRef: false,
  },
  {
    name: 'GET /available-routes',
    method: 'GET',
    path: '/available-routes',
    calls: [{ originChainId: '1', destinationChainId: '10' }],
    schemaPath:
      'paths./available-routes.get.responses.200.content.application/json.schema',
    usesRef: false,
  },
  {
    name: 'GET /suggested-fees',
    method: 'GET',
    path: '/suggested-fees',
    calls: [
      {
        inputToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        outputToken: '0x4200000000000000000000000000000000000006',
        originChainId: '1',
        destinationChainId: '10',
        amount: '1000000000000000000',
      },
    ],
    schemaPath:
      'paths./suggested-fees.get.responses.200.content.application/json.schema',
    usesRef: true,
    refPath: '#/components/schemas/SuggestedFees',
  },
  {
    name: 'GET /limits',
    method: 'GET',
    path: '/limits',
    calls: [
      {
        inputToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        outputToken: '0x4200000000000000000000000000000000000006',
        originChainId: '1',
        destinationChainId: '10',
      },
    ],
    schemaPath:
      'paths./limits.get.responses.200.content.application/json.schema',
    usesRef: true,
    refPath: '#/components/schemas/TransferLimits',
  },
  {
    name: 'GET /deposit/status',
    method: 'GET',
    path: '/deposit/status',
    // Uses the example deposit tx hash from the spec.
    // Additional hashes can be added for pending/expired status coverage.
    calls: [
      {
        depositTxnRef:
          '0x01ef7ad7ed64e273b2a63b22fb75abf42ecd7b65e8deb96c440ec3cd56915a84',
      },
    ],
    schemaPath:
      'paths./deposit/status.get.responses.200.content.application/json.schema',
    usesRef: false,
  },
  {
    name: 'GET /deposits',
    method: 'GET',
    path: '/deposits',
    // Uses a known active depositor address
    calls: [
      {
        address: '0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D',
        limit: '1',
      },
    ],
    schemaPath:
      'paths./deposits.get.responses.200.content.application/json.schema',
    usesRef: false,
  },
  {
    name: 'GET /swap/approval',
    method: 'GET',
    path: '/swap/approval',
    calls: [
      {
        originChainId: '42161',
        destinationChainId: '8453',
        inputToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        outputToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        amount: '100000000',
        depositor: '0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D',
        tradeType: 'minOutput',
      },
    ],
    schemaPath:
      'paths./swap/approval.get.responses.200.content.application/json.schema',
    usesRef: false,
  },
  // POST /swap/approval is skipped — requires wallet-signed actions in the body
];
