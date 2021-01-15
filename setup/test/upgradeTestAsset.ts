import hre from 'hardhat';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction, DeploymentSubmission} from 'hardhat-deploy/types';

const func: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const {deployments, getNamedAccounts, getChainId, upgrades, ethers} = hre;
  const {deployer} = await getNamedAccounts();

  const Asset = await deployments.get('Asset');
  const TestAsset = await ethers.getContractFactory('TestAsset', deployer);
  const upgraded = await upgrades.upgradeProxy(Asset.address, TestAsset);

  await upgraded.deployed();

  const hello = await upgraded.callStatic.test();
  console.log({hello});
};

export default func;
if (require.main === module) {
  func(hre);
}