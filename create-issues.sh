#!/bin/bash

# DevRel Campaign Issues Creation Script
# Run this script where you have gh CLI configured

set -e

echo "Creating DevRel Campaign Issues..."

# Issue 1: Enhance Existing Contract Example
echo "Creating Issue 1: Enhance Existing Contract Example"
gh issue create \
  --repo cedra-labs/move-contract-examples \
  --title "Enhance Existing Contract Example" \
  --label "enhancement,good-first-issue,devrel-campaign" \
  --body "## Description
Pick any existing example and make it significantly better

## Ideas
- Add missing features
- Improve gas efficiency
- Better error handling
- Add admin controls
- Enhanced documentation

## Requirements
- Explain what you improved and why
- Show before/after comparison
- Update all relevant tests

## PR Guidelines
PR to: Existing example folder with clear description"

# Issue 2: Deep Dive into Any Undocumented Cedra Feature
echo "Creating Issue 2: Deep Dive into Any Undocumented Cedra Feature"
gh issue create \
  --repo cedra-labs/docs \
  --title "Deep Dive into Any Undocumented Cedra Feature" \
  --label "documentation,research,devrel-campaign" \
  --body "## Description
Find something in Cedra that lacks documentation and document it thoroughly

## Process
1. Identify undocumented/poorly documented feature
2. Research through code and testing
3. Write comprehensive documentation
4. Add practical examples

## Requirements
- Technical accuracy
- Code examples
- Common gotchas
- Real-world usage

## PR Guidelines
PR to: Appropriate docs section"

# Issue 3: Build Any On-Chain Game Mechanic
echo "Creating Issue 3: Build Any On-Chain Game Mechanic"
gh issue create \
  --repo cedra-labs/move-contract-examples \
  --title "Build Any On-Chain Game Mechanic" \
  --label "enhancement,game-mechanics,devrel-campaign" \
  --body "## Description
Implement any game-related smart contract

## Ideas
- Rock-paper-scissors with commit-reveal
- Simple RPG character stats
- Loot box/gacha system
- Turn-based battle logic
- Leaderboard system
- Achievement/badge system
- Any game mechanic you like

## Requirements
- Fun and functional
- Anti-cheat considerations
- Gas-efficient for gameplay
- Example game using it

## PR Guidelines
PR to: \`/game-mechanics/[your-game-mechanic]\`"

# Issue 4: Create Any Technical Guide for Cedra
echo "Creating Issue 4: Create Any Technical Guide for Cedra"
gh issue create \
  --repo cedra-labs/docs \
  --title "Create Any Technical Guide for Cedra" \
  --label "documentation,guide,devrel-campaign" \
  --body "## Description
Write a guide about something not yet documented

## Suggestions
- SDK Api reference
- How to integrate with frontend frameworks
- How to estimate gas before transactions
- How to optimize for parallel execution
- Any other \"How to\" you think developers need

## Requirements
- 500+ words
- Code examples
- Common pitfalls section

## PR Guidelines
PR to: \`/guides/how-to-[your-topic]\`"

# Issue 5: Event Indexing Guide
echo "Creating Issue 5: Event Indexing Guide"
gh issue create \
  --repo cedra-labs/docs \
  --title "Event Indexing Guide" \
  --label "documentation,guide,events,devrel-campaign" \
  --body "## Description
Create a comprehensive guide for event indexing in Cedra

## Deliverables
- How to emit events properly
- Event structure best practices
- Indexing with GraphQL
- Frontend event listening

## PR Guidelines
PR to: \`/guides/event-indexing\`"

# Issue 6: Upgradeability Patterns in Move
echo "Creating Issue 6: Upgradeability Patterns in Move"
gh issue create \
  --repo cedra-labs/docs \
  --title "Upgradeability Patterns in Move" \
  --label "documentation,guide,advanced,devrel-campaign" \
  --body "## Description
Document upgradeability patterns and best practices for Move contracts

## Deliverables
- Module upgrade strategies
- Data migration patterns
- Version management
- Breaking vs non-breaking changes

## PR Guidelines
PR to: \`/guides/upgradeability\`"

echo ""
echo "✅ All DevRel Campaign issues created successfully!"
echo ""
echo "Issues created in:"
echo "  - cedra-labs/move-contract-examples (2 issues)"
echo "  - cedra-labs/docs (4 issues)"
