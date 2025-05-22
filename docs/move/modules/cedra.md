---
id: cedra
title: Cedra Core Module
sidebar_position: 1
---

# Cedra Core Module

This document describes the core Cedra module, which implements the main functionality of the protocol.

## Module Overview

```move
/// Core Cedra module providing the main functionality
module cedra::core {
    // Resources, structs, and functions
}
```

## Resources and Structs

### Resource: `Config`

The main configuration resource that stores global protocol settings.

```move
struct Config has key {
    // Fields
}
```

### Struct: `OperationData`

Represents operation data for protocol interactions.

```move
struct OperationData has copy, drop, store {
    // Fields
}
```

## Public Functions

### initialize

```move
public fun initialize(admin: &signer)
```

Initializes the Cedra protocol with the given admin account.

**Parameters:**
- `admin: &signer` - The signer of the admin account that will have special permissions

**Errors:**
- `EALREADY_INITIALIZED` - If the protocol is already initialized
- `ENOT_APTOS_FRAMEWORK` - If the caller is not the Aptos framework account

### Example Usage

```move
use cedra::core;

public entry fun init_cedra(admin: &signer) {
    core::initialize(admin);
}
```

### additional_function

```move
public fun additional_function(param1: address, param2: u64): u64
```

Description of what this function does.

**Parameters:**
- `param1: address` - Description of param1
- `param2: u64` - Description of param2

**Returns:**
- `u64` - Description of the return value

**Errors:**
- `ESOME_ERROR` - Description of when this error occurs

## Events

### EventType

```move
struct EventType has drop, store {
    // Fields
}
```

Emitted when certain operations occur.

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 0 | `EALREADY_INITIALIZED` | The module has already been initialized |
| 1 | `ENOT_ADMIN` | The signer is not the admin |
| 2 | `EINVALID_STATE` | The operation cannot be performed in the current state | 