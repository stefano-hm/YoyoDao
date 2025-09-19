import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("DAO governance - vote", function () {
  let payToken: any;
  let dao: any;
  let owner: any, alice: any, bob: any;

  const one = ethers.parseUnits("1", 18);

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20", owner);
    payToken = await MockERC20.deploy(
      "PayToken",
      "PAY",
      ethers.parseUnits("1000000", 18)
    );
    await payToken.waitForDeployment();

    const DAO = await ethers.getContractFactory("DAO", owner);
    dao = await DAO.deploy(await payToken.getAddress(), one);
    await dao.waitForDeployment();

    await payToken.mint(await alice.getAddress(), ethers.parseUnits("100", 18));

    await payToken
      .connect(alice)
      .approve(await dao.getAddress(), ethers.parseUnits("100", 18));
    await dao.connect(alice).buyShares(10);

    const tx = await dao
      .connect(alice)
      .propose("Test Proposal", "Proposal description", ethers.ZeroAddress, 0);
    await tx.wait();
  });

  it("should allow members to vote and update vote counts", async function () {
    const voteTx = await dao.connect(alice).vote(1, 1);
    await voteTx.wait();

    const proposal = await dao.proposals(1);
    expect(proposal.votesFor).to.equal(10n);
    expect(proposal.votesAgainst).to.equal(0n);
    expect(proposal.votesAbstain).to.equal(0n);
  });

  it("should fail if non-member tries to vote", async function () {
    await expect(dao.connect(bob).vote(1, 1)).to.be.revertedWith(
      "must hold shares to vote"
    );
  });
});
