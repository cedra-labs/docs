---
id: getting-started
title: Getting Started with Cedra
sidebar_position: 2
---

# Getting Started with Cedra

This guide will help you set up your development environment and start building with Cedra on Aptos.

## Prerequisites

Before you begin, make sure you have:

- [Aptos CLI](https://aptos.dev/cli-tools/aptos-cli-tool/install-aptos-cli/) installed
- [Move language basics](https://aptos.dev/move/move-on-aptos) understanding
- A code editor with Move language support

## Installation

Add Cedra to your project by including it as a dependency in your `Move.toml` file:

```toml
[dependencies]
Cedra = { git = "https://github.com/cedra-labs/cedra.git", rev = "main" }
```

## Basic Integration

Here's a simple example showing how to integrate with Cedra:

```move
module my_app::example {
    use cedra::core;
    use aptos_framework::account;
    
    // Example function
    public entry fun initialize(caller: &signer) {
        // Your integration code here
    }
}
```

## Key Concepts

When working with Cedra, it's important to understand these core concepts:

1. **Concept 1**: Explanation of concept 1
2. **Concept 2**: Explanation of concept 2
3. **Concept 3**: Explanation of concept 3

## Next Steps

Now that you've set up your environment, you can:

- Explore the [Module Reference](modules/cedra.md) for detailed API documentation
- Check out our example implementations
- Join our community for support 