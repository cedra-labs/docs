# DevRel Campaign Issues

## Issue 1: Enhance Existing Contract Example
**Repo**: move-contract-examples
**Labels**: enhancement, good-first-issue, devrel-campaign

### Description
Pick any existing example and make it significantly better

### Ideas
- Add missing features
- Improve gas efficiency
- Better error handling
- Add admin controls
- Enhanced documentation

### Requirements
- Explain what you improved and why
- Show before/after comparison
- Update all relevant tests

### PR Guidelines
PR to: Existing example folder with clear description

---

## Issue 2: Deep Dive into Any Undocumented Cedra Feature
**Repo**: docs.cedra.network (cedra-labs/docs)
**Labels**: documentation, research, devrel-campaign

### Description
Find something in Cedra that lacks documentation and document it thoroughly

### Process
1. Identify undocumented/poorly documented feature
2. Research through code and testing
3. Write comprehensive documentation
4. Add practical examples

### Requirements
- Technical accuracy
- Code examples
- Common gotchas
- Real-world usage

### PR Guidelines
PR to: Appropriate docs section

---

## Issue 3: Build Any On-Chain Game Mechanic
**Repo**: move-contract-examples
**Labels**: enhancement, game-mechanics, devrel-campaign

### Description
Implement any game-related smart contract

### Ideas
- Rock-paper-scissors with commit-reveal
- Simple RPG character stats
- Loot box/gacha system
- Turn-based battle logic
- Leaderboard system
- Achievement/badge system
- Any game mechanic you like

### Requirements
- Fun and functional
- Anti-cheat considerations
- Gas-efficient for gameplay
- Example game using it

### PR Guidelines
PR to: `/game-mechanics/[your-game-mechanic]`

---

## Issue 4: Create Any Technical Guide for Cedra
**Repo**: docs.cedra.network (cedra-labs/docs)
**Labels**: documentation, guide, devrel-campaign

### Description
Write a guide about something not yet documented

### Suggestions
- SDK Api reference
- How to integrate with frontend frameworks
- How to estimate gas before transactions
- How to optimize for parallel execution
- Any other "How to" you think developers need

### Requirements
- 500+ words
- Code examples
- Common pitfalls section

### PR Guidelines
PR to: `/guides/how-to-[your-topic]`

---

## Issue 5: Event Indexing Guide
**Repo**: docs.cedra.network (cedra-labs/docs)
**Labels**: documentation, guide, events, devrel-campaign

### Description
Create a comprehensive guide for event indexing in Cedra

### Deliverables
- How to emit events properly
- Event structure best practices
- Indexing with GraphQL
- Frontend event listening

### PR Guidelines
PR to: `/guides/event-indexing`

---

## Issue 6: Upgradeability Patterns in Move
**Repo**: docs.cedra.network (cedra-labs/docs)
**Labels**: documentation, guide, advanced, devrel-campaign

### Description
Document upgradeability patterns and best practices for Move contracts

### Deliverables
- Module upgrade strategies
- Data migration patterns
- Version management
- Breaking vs non-breaking changes

### PR Guidelines
PR to: `/guides/upgradeability`

---

## How to Create These Issues

### Option 1: Using GitHub CLI (gh)
```bash
# For docs repo issues (Issues 2, 4, 5, 6)
gh issue create --repo cedra-labs/docs --title "Issue Title" --body "Issue body content"

# For move-contract-examples issues (Issues 1, 3)
gh issue create --repo cedra-labs/move-contract-examples --title "Issue Title" --body "Issue body content"
```

### Option 2: Manual Creation
1. Go to the repository on GitHub
2. Click on "Issues" tab
3. Click "New Issue"
4. Copy the title and description from above
5. Add appropriate labels

### Option 3: GitHub API
Use the GitHub REST API to programmatically create issues.
