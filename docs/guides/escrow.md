# WIP From Lockup to Payout: Building Secure FA Escrows

**Purpose**: A reusable on‑chain time‑locked escrow that lets many senders lock Fungible Asset (FA) tokens for one recipient. Funds can be released immediately or after a specified time.

## How It Works

| Component   | Role                                                                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LockupRef` | Resource kept in the recipient account. It stores the address of the active `Lockup` object so it can be found quickly.                                                               |
| `Lockup`    | Object that owns a `SmartTable` mapping `(FA, sender)` to an escrow address. It carries `ExtendRef` and `DeleteRef` so it can mutate itself and reclaim storage.                      |
| `Escrow`    | Object created per `(sender, FA)` pair. Two variants: `Simple` with no time restriction and `TimeUnlock` that unlocks after `unlock_secs`. Each variant includes its own `DeleteRef`. |

### Typical Flow

1. The recipient calls `initialize_lockup`. This creates a `Lockup` object and writes a `LockupRef` marker to the account.
2. A sender calls `escrow_funds_with_no_lockup` or `escrow_funds_with_time` to move FA tokens into an `Escrow` object managed by the `Lockup`.
3. The recipient can either

   * call `claim_escrow` to move the funds to a personal balance, or
   * call `return_user_funds` to refund the sender.
4. The sender can call `return_my_funds` to self‑refund after the unlock time passes.
5. When an escrow is emptied the contract deletes its store and object, returning storage fees to the payer.

## Safety Notes and Error Codes

* All objects include a `DeleteRef` so storage can be reclaimed.
* Only the `Lockup` creator (the recipient) can claim or refund third‑party escrows.
* Unlock time can be extended but never shortened (`E_CANNOT_SHORTEN_LOCKUP_TIME`).
* Eight custom abort codes make it easy to diagnose failures.
