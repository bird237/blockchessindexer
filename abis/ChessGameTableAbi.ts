export const ChessGameTableAbi = [
  {
    "type": "constructor",
    "inputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "FIFTY_MOVE_HALFMOVES",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint16",
        "internalType": "uint16"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "GROUP_VOTE_WINDOW",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MAX_MOVE_TIMEOUT",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MAX_RAMP_PLY",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MAX_REFERRAL_FEE_BPS",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint16",
        "internalType": "uint16"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MAX_STAKE_MULTIPLIER",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MIN_MOVE_TIMEOUT",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MIN_RAMP_PLY",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "THREEFOLD_COUNT",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "acceptStakeIncrease",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "acceptTakeback",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "baseStake",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "blackPlayer",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "blackPotShare",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "board",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "cancelGroupProposal",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "cancelStakeIncrease",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "cancelTakeback",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "castlingRights",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "claimCheckmate",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "claimFiftyMoveRule",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "claimShare",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "claimStalemate",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "claimThreefoldRepetition",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "claimTimeoutVictory",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "claimableActions",
    "inputs": [],
    "outputs": [
      {
        "name": "a",
        "type": "tuple",
        "internalType": "struct ChessGameTable.ClaimableActions",
        "components": [
          {
            "name": "checkmate",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "stalemate",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "fiftyMoveRule",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "threefoldRepetition",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "timeoutVictory",
            "type": "bool",
            "internalType": "bool"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "closedProposalDeadline",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "colorOf",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "enum ChessGameTable.Color"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "compoundRateBps",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "contribution",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "currentStake",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "curve",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "enum ChessGameTable.StakeCurve"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "enPassantSquare",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "frontendRecipient",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "groupProposalDeadline",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "groupProposalId",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "groupProposalKind",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "enum ChessGameTable.ProposalKind"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "groupProposedValue",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "groupProposer",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "halfmoveClock",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint16",
        "internalType": "uint16"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "hasClaimedShare",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "initialize",
    "inputs": [
      {
        "name": "_mode",
        "type": "uint8",
        "internalType": "enum ChessGameTable.Mode"
      },
      {
        "name": "_white",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_black",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_baseStake",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_rampPly",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "_moveTimeout",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "_curve",
        "type": "uint8",
        "internalType": "enum ChessGameTable.StakeCurve"
      },
      {
        "name": "_protocolFeeRecipient",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_protocolFeeBps",
        "type": "uint16",
        "internalType": "uint16"
      },
      {
        "name": "_frontendRecipient",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_referralFeeBps",
        "type": "uint16",
        "internalType": "uint16"
      },
      {
        "name": "_token",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "lastMoveTimestamp",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "lastMover",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "lastVotedGroupProposalId",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "makeMove",
    "inputs": [
      {
        "name": "from",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "to",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "promotion",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "mode",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "enum ChessGameTable.Mode"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "moveTimeout",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "plyCount",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "positionCounts",
    "inputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "pot",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "proposeStakeIncrease",
    "inputs": [
      {
        "name": "newBaseStake",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "proposeTakeback",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "proposedBaseStake",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "protocolFeeBps",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint16",
        "internalType": "uint16"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "protocolFeeRecipient",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "rampPly",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "referralFeeBps",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint16",
        "internalType": "uint16"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "rejectStakeIncrease",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "rejectTakeback",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "resign",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "result",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "enum ChessGameTable.Result"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "sharesFinalized",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "stakeIncreaseProposer",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "status",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "enum ChessGameTable.Status"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "takebackProposer",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "token",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalBlackContribution",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalWhiteContribution",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "voteOnGroupProposal",
    "inputs": [
      {
        "name": "support",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "votedWeightBlack",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "votedWeightWhite",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "whitePlayer",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "whitePotShare",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "whiteToMove",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "withdraw",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "withdrawable",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "yesWeightBlack",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "yesWeightWhite",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "GameFinished",
    "inputs": [
      {
        "name": "result",
        "type": "uint8",
        "indexed": false,
        "internalType": "enum ChessGameTable.Result"
      },
      {
        "name": "triggeredBy",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "GroupProposalCancelled",
    "inputs": [
      {
        "name": "kind",
        "type": "uint8",
        "indexed": false,
        "internalType": "enum ChessGameTable.ProposalKind"
      },
      {
        "name": "value",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "deadlocked",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "GroupProposalVoteCast",
    "inputs": [
      {
        "name": "voter",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "support",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      },
      {
        "name": "weight",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Initialized",
    "inputs": [
      {
        "name": "version",
        "type": "uint64",
        "indexed": false,
        "internalType": "uint64"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "MoveMade",
    "inputs": [
      {
        "name": "mover",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "from",
        "type": "uint8",
        "indexed": false,
        "internalType": "uint8"
      },
      {
        "name": "to",
        "type": "uint8",
        "indexed": false,
        "internalType": "uint8"
      },
      {
        "name": "promotion",
        "type": "uint8",
        "indexed": false,
        "internalType": "uint8"
      },
      {
        "name": "stakePaid",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ShareClaimed",
    "inputs": [
      {
        "name": "contributor",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "StakeIncreaseAccepted",
    "inputs": [
      {
        "name": "newBaseStake",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "StakeIncreaseCancelled",
    "inputs": [
      {
        "name": "proposer",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "rejectedBaseStake",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "byProposer",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "StakeIncreaseProposed",
    "inputs": [
      {
        "name": "proposer",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "newBaseStake",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "StakeIncreaseRejected",
    "inputs": [
      {
        "name": "rejectedBaseStake",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "TakebackAccepted",
    "inputs": [
      {
        "name": "proposer",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "accepter",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "refunded",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "TakebackCancelled",
    "inputs": [
      {
        "name": "proposer",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "byProposer",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "TakebackProposed",
    "inputs": [
      {
        "name": "proposer",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "TakebackRejected",
    "inputs": [
      {
        "name": "accepter",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "AlreadyClaimedShare",
    "inputs": []
  },
  {
    "type": "error",
    "name": "AlreadyVotedOnThisProposal",
    "inputs": []
  },
  {
    "type": "error",
    "name": "AtLeastOneCommittedPlayerRequired",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BaseStakeMustBePositive",
    "inputs": []
  },
  {
    "type": "error",
    "name": "CancelVoteOnlyForCrowd",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ClosedProposalWindowStillOpen",
    "inputs": []
  },
  {
    "type": "error",
    "name": "CrowdMoveTimeoutInvalid",
    "inputs": []
  },
  {
    "type": "error",
    "name": "CrowdPlayersMustBeUnset",
    "inputs": []
  },
  {
    "type": "error",
    "name": "DuelMoveTimeoutOutOfRange",
    "inputs": []
  },
  {
    "type": "error",
    "name": "DuelSettlesViaWithdraw",
    "inputs": []
  },
  {
    "type": "error",
    "name": "FiftyMoveRuleNotReached",
    "inputs": []
  },
  {
    "type": "error",
    "name": "GameNotActive",
    "inputs": []
  },
  {
    "type": "error",
    "name": "GameNotFinishedYet",
    "inputs": []
  },
  {
    "type": "error",
    "name": "GroupProposalAlreadyActive",
    "inputs": []
  },
  {
    "type": "error",
    "name": "IllegalMove",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidInitialization",
    "inputs": []
  },
  {
    "type": "error",
    "name": "MoveTimeoutNotReached",
    "inputs": []
  },
  {
    "type": "error",
    "name": "MustBeStrictIncrease",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NoMoveTimeoutConfigured",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NoMoveToTakeBack",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NoPendingGroupProposal",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NoPendingStakeIncreaseProposal",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NoPendingTakebackProposal",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NoSnapshotAvailable",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotAContributor",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotAPlayer",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotActuallyCheckmate",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotActuallyStalemate",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotInitializing",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotYourTurn",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NothingToWithdraw",
    "inputs": []
  },
  {
    "type": "error",
    "name": "OnlyLastMoverMayClaim",
    "inputs": []
  },
  {
    "type": "error",
    "name": "OnlyOpponentCanAcceptStakeIncrease",
    "inputs": []
  },
  {
    "type": "error",
    "name": "OnlyOpponentCanAcceptTakeback",
    "inputs": []
  },
  {
    "type": "error",
    "name": "OnlyOpponentCanRejectStakeIncrease",
    "inputs": []
  },
  {
    "type": "error",
    "name": "OnlyOpponentCanRejectTakeback",
    "inputs": []
  },
  {
    "type": "error",
    "name": "OpponentSeatVacant",
    "inputs": []
  },
  {
    "type": "error",
    "name": "PendingGroupProposalMustResolveFirst",
    "inputs": []
  },
  {
    "type": "error",
    "name": "PendingStakeIncreaseMustResolveFirst",
    "inputs": []
  },
  {
    "type": "error",
    "name": "PendingTakebackMustResolveFirst",
    "inputs": []
  },
  {
    "type": "error",
    "name": "PlayersMustDiffer",
    "inputs": []
  },
  {
    "type": "error",
    "name": "RampPlyOutOfRange",
    "inputs": []
  },
  {
    "type": "error",
    "name": "RepetitionThresholdNotReached",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ResignOnlyForDuel",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SideToMoveInCheckUseCheckmate",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SideToMoveNotInCheck",
    "inputs": []
  },
  {
    "type": "error",
    "name": "StakeIncreaseAlreadyProposed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "StakeIncreaseNotSupported",
    "inputs": []
  },
  {
    "type": "error",
    "name": "StakeTransferFailed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "StakeWouldNeverGrow",
    "inputs": []
  },
  {
    "type": "error",
    "name": "TakebackAlreadyProposed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "TakebackNotSupported",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UseCancelStakeIncreaseVoteInstead",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UseVoteStakeIncreaseInstead",
    "inputs": []
  },
  {
    "type": "error",
    "name": "VoteWindowStillOpen",
    "inputs": []
  },
  {
    "type": "error",
    "name": "VotingOnlyForCrowd",
    "inputs": []
  },
  {
    "type": "error",
    "name": "WalletLockedToOtherColor",
    "inputs": []
  },
  {
    "type": "error",
    "name": "WithdrawTransferFailed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "WrongStakeAmount",
    "inputs": []
  }
] as const;
