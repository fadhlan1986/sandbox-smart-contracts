import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import getAssets from '../data/asset_giveaway_1/getAssets';

const ASSETS_HOLDER = '0x0000000000000000000000000000000000000000';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts, network, getChainId} = hre;
  const {deploy} = deployments;
  const chainId = await getChainId();
  const {deployer} = await getNamedAccounts();

  const {assets, merkleRootHash} = getAssets(network.live, chainId);

  const assetContract = await deployments.get('Asset');

  await deploy('NFT_Lottery_1', {
    contract: 'AssetGiveaway',
    from: deployer,
    linkedData: assets,
    log: true,
    args: [assetContract.address, merkleRootHash, ASSETS_HOLDER],
  });
};
export default func;
func.tags = ['NFT_Lottery_1', 'NFT_Lottery_1_deploy'];