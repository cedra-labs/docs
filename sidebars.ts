import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
 const sidebars: SidebarsConfig = {
  docs: [
    {
      type: 'category',
      label: '🏠 Welcome to Cedra',
      className: 'sidebar-welcome',
      items: [
        {
          type: 'doc',
          id: 'intro',
          label: 'What is Cedra?'
        },
        {
          type: 'doc',
          id: 'handbook-for-newcomers',
          label: 'Developer Roadmap',
          className: 'sidebar-badge-new'
        },
        {
          type: 'doc',
          id: 'architecture',
          label: 'Architecture Overview'
        },
      ]
    },
    {
      type: 'category',
      label: '⚡ Quick Start',
      className: 'sidebar-quickstart sidebar-badge-popular',
      link: {
        type: 'doc',
        id: 'getting-started/index',
      },
      items: [
        {
          type: 'doc',
          id: 'getting-started/libs',
          label: 'Setup Node.js and Rust'
        },
        {
          type: 'doc',
          id: 'getting-started/cli',
          label: 'Install Cedra CLI'
        },
        {
          type: 'doc',
          id: 'getting-started/faucet',
          label: 'Get Test Tokens from Faucet'
        },
        {
          type: 'doc',
          id: 'getting-started/tx',
          label: 'First Transactions'
        },
        {
          type: 'doc',
          id: 'getting-started/counter',
          label: 'Build a Counter Contract',
          className: 'sidebar-badge-tutorial'
        }
      ]
    },
    {
      type: 'category',
      label: '🎯 Build Real Projects',
      className: 'sidebar-projects sidebar-badge-hot',
      link: {
        type: 'doc',
        id: 'real-world-guides',
      },
      items: [
        {
          type: 'doc',
          id: 'guides/first-fa',
          label: 'Fungible Asset (FA) End-to-End Guide',
          className: 'sidebar-badge-guide'
        },
        {
          type: 'doc',
          id: 'guides/first-nft',
          label: 'NFT Contract - Full Code Walkthrough',
          className: 'sidebar-badge-complete'
        },
        {
          type: 'doc',
          id: 'guides/fee-splitter',
          label: 'Build a Fee Splitter Contract'
        },
        {
          type: 'doc',
          id: 'guides/escrow',
          label: 'Building Secure Token Vesting & Marketplace via Escrow'
        },
        {
          type: 'category',
          label: 'Build a DEX on Cedra',
          link: {
            type: 'doc',
            id: 'guides/dex/index',
          },
          className: 'sidebar-badge-complete',
          items: [
            {
              type: 'doc',
              id: 'guides/dex/understanding-amm',
              label: 'Understanding Automated Market Makers'
            },
            {
              type: 'doc',
              id: 'guides/dex/first-trading-pair',
              label: 'Building Your First Trading Pair'
            },
            {
              type: 'doc',
              id: 'guides/dex/price-protection',
              label: 'Adding Price Protection Mechanisms'
            },
            {
              type: 'doc',
              id: 'guides/dex/multi-hop-routing',
              label: 'Multi-hop Routing for Optimal Execution'
            },
            {
              type: 'doc',
              id: 'guides/dex/client-integration',
              label: 'DEX Client Integration Guide'
            }
          ]
        }
      ]
    },
    {
      type: 'category',
      label: '📚 Move Programming',
      className: 'sidebar-reference',
      collapsed: true,
      link: {
        type: 'doc',
        id: 'move/index',
      },
      items: [
        {
          type: 'doc',
          id: 'move/introduction',
          label: 'Resource First Programming'
        },
        {
          type: 'doc',
          id: 'move/basics',
          label: 'Basic Syntax and Data Types'
        },
        {
          type: 'doc',
          id: 'move/modules',
          label: 'Dive Deep into Move Modules'
        },
        {
          type: 'doc',
          id: 'move/functions',
          label: 'Functions in Move'
        },
        {
          type: 'doc',
          id: 'move/resource',
          label: 'Resource Types',
          className: 'sidebar-badge-important'
        },
        {
          type: 'doc',
          id: 'move/ownership',
          label: 'Ownership & Borrowing'
        },
        {
          type: 'doc',
          id: 'move/flow',
          label: 'Conditionals, Loops, and Control Flow'
        },
        {
          type: 'doc',
          id: 'move/errors',
          label: 'Error Handling and Assertions'
        }
      ]
    },
    // {
    //   type: 'category',
    //   label: '🖥️ Nodes',
    //   className: 'sidebar-nodes',
    //   collapsed: true,
    //   link: {
    //     type: 'doc',
    //     id: 'nodes/index',
    //   },
    //   items: [
    //     {
    //       type: 'doc',
    //       id: 'nodes/requirements',
    //       label: 'System Requirements'
    //     },
    //     {
    //       type: 'category',
    //       label: 'Run a Validator',
    //       className: 'sidebar-badge-important',
    //       items: [
    //         {
    //           type: 'doc',
    //           id: 'nodes/validator-setup',
    //           label: 'Validator Setup'
    //         },
    //         {
    //           type: 'doc',
    //           id: 'nodes/stake-pool-management',
    //           label: 'Direct Staking'
    //         },
    //         {
    //           type: 'doc',
    //           id: 'nodes/delegation-pool-setup',
    //           label: 'Delegation Staking',
    //           className: 'sidebar-badge-new'
    //         }
    //       ]
    //     },
    //     {
    //       type: 'doc',
    //       id: 'nodes/full-node',
    //       label: 'Run a Full Node'
    //     }
    //   ]
    // },
    {
      type: 'category',
      label: '🛠️ Developer Tools',
      className: 'sidebar-tools',
      collapsed: true,
      items: [
        {
          type: 'doc',
          id: 'cli/usage',
          label: 'CLI Reference'
        },
        {
          type: 'doc',
          id: 'glossary',
          label: 'Glossary'
        }
      ]
    }
  ]
};

export default sidebars;
