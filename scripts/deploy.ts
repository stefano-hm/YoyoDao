import { network } from "hardhat";
const { ethers } = await network.connect();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", await deployer.getAddress());

  const MockERC20 = await ethers.getContractFactory("MockERC20", deployer);
  const payToken = await MockERC20.deploy(
    "PayToken",
    "PAY",
    ethers.parseUnits("1000000", 18)
  );
  await payToken.waitForDeployment();
  console.log("PayToken deployed at:", await payToken.getAddress());

  const DAO = await ethers.getContractFactory("DAO", deployer);
  const dao = await DAO.deploy(
    await payToken.getAddress(),
    ethers.parseUnits("1", 18)
  );
  await dao.waitForDeployment();
  console.log("DAO deployed at:", await dao.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
