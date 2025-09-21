# YoYoDAO

A decentralized autonomous organization (DAO) smart contract project that allows members to buy shares using an ERC-20 token, create and vote on proposals with weighted votes, delegate votes to other members, and optionally transfer ERC-20 tokens from the DAO to external addresses. The project demonstrates both **direct democracy** and **liquid democracy** governance strategies on the Ethereum Sepolia testnet.

---

## Table of Contents

1. [Features](#features)  
2. [Installation and Setup](#installation-and-setup)  
3. [Deployment](#deployment)  
4. [Usage Examples](#usage-examples)  
5. [Testing](#testing)  
6. [License](#license)  

---

## Features

- **DAO Functionality**:
  - Buy shares with a payment ERC-20 token (`PayToken`)
  - Create proposals with a title, description, optional token transfers
  - Vote on proposals with weighted votes proportional to shares
  - Delegate votes to other members (liquid democracy)
  - Finalize proposals based on majority votes

- **Governance Strategies**:
  - **Direct democracy**: every member votes directly on proposals
  - **Liquid democracy**: members can delegate their votes to trusted representatives

- **ERC-20 Integration**:
  - Payment using a MockERC20 token
  - Optional transfers from DAO to external addresses upon proposal approval

- **Testing and Deployment**:
  - Hardhat TypeScript scripts for deployment and testing
  - Tests cover buying shares, membership, voting and owner withdrawals

---

## Installation and Setup

1. **Clone the repository**:

```bash
git clone <repository_url>
cd yoyo-dao
```

2. **Install dependencies**

```bash
npm install
# or
pnpm install
# or
yarn install
```

3. **Create** ```.env``` **file** in the root directory and add:

```bash
SEPOLIA_RPC_URL=<your_sepolia_rpc_url>
SEPOLIA_PRIVATE_KEY=<your_private_key>
```

**Note:** Never commit your ```.env``` file to GitHub. Add it to ```.gitignore```.

4. **Compile contracts:**

```npx hardhat compile```

---

## Deployment

Contracts are deployed on **Sepolia testnet:**

- **PayToken:** ```0xeF72Ae8A5816B81C90A1bf70b52420fB504ed7b1```
- **DAO:** ```0x73804394A4612ffef0D43192cC8F505B223896f2```

To deploy locally or to Sepolia:

```npx hardhat run scripts/deploy.ts --network sepolia```

---

## Usage Examples

**Buy Shares**

```bash
await payToken.connect(user).approve(dao.address, ethers.parseUnits("10", 18));
await dao.connect(user).buyShares(10);
```

**Create a Proposal**

```bash
await dao.connect(user).propose(
  "Buy new equipment",
  "Proposal to allocate DAO funds for new equipment",
  recipientAddress,
  ethers.parseUnits("5", 18)
);
```

**Vote on a Proposal**

```bash
await dao.connect(user).vote(proposalId, 1); // 1 = For, 2 = Against, 3 = Abstain
```

**Delegate Vote**

```bash
await dao.connect(user).delegate(delegateAddress);
await dao.connect(delegateAddress).castVoteAsDelegate(proposalId, [user.address], 1);
```

**Finalize Proposal**

```bash
await dao.finalizeProposal(proposalId);
```

---

## Testing

```bash
npx hardhat test
```

The tests cover:

- Buying shares and membership recognition
- Token balances and DAO funds
- Proposal creation and voting
- Owner withdrawals

## License

Tis project is licensed under the **MIT License**.


