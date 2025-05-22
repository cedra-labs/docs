---
id: accounts
title: Accounts Module
sidebar_position: 2
---

# Accounts Module

This document describes the Accounts module, which handles user account management within the Cedra protocol.

## Module Overview

```move
/// Module for managing Cedra user accounts
module cedra::accounts {
    // Resources, structs, and functions
}
```

## Resources and Structs

### Resource: `AccountInfo`

Stores information about a user account.

```move
struct AccountInfo has key {
    // Fields
}
```

### Struct: `AccountCapability`

Represents permission capability for account operations.

```move
struct AccountCapability has copy, drop, store {
    // Fields
}
```

## Public Functions

### create_account

```move
public entry fun create_account(user: &signer)
```

Creates a new account within the Cedra protocol.

**Parameters:**
- `user: &signer` - The signer of the account to be created

**Errors:**
- `EACCOUNT_ALREADY_EXISTS` - If the account already exists
- `EPROTOCOL_NOT_INITIALIZED` - If the Cedra protocol has not been initialized

### Example Usage

```move
use cedra::accounts;

public entry fun create_my_account(user: &signer) {
    accounts::create_account(user);
}
```

### get_account_info

```move
public fun get_account_info(addr: address): AccountInfo
```

Retrieves account information for the given address.

**Parameters:**
- `addr: address` - The address to get account information for

**Returns:**
- `AccountInfo` - The account information

**Errors:**
- `EACCOUNT_DOESNT_EXIST` - If the account does not exist

## Events

### AccountCreatedEvent

```move
struct AccountCreatedEvent has drop, store {
    // Fields
}
```

Emitted when a new account is created.

### AccountUpdatedEvent

```move
struct AccountUpdatedEvent has drop, store {
    // Fields
}
```

Emitted when an account is updated.

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 0 | `EACCOUNT_ALREADY_EXISTS` | The account already exists |
| 1 | `EACCOUNT_DOESNT_EXIST` | The account does not exist |
| 2 | `EPROTOCOL_NOT_INITIALIZED` | The Cedra protocol has not been initialized |
| 3 | `EINVALID_PERMISSION` | The signer does not have permission for this operation | 