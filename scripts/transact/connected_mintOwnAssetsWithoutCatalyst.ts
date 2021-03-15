import {BigNumber} from 'ethers';
import {getNamedAccounts, ethers, network, deployments} from 'hardhat';

const {read} = deployments;

const args = process.argv.slice(2);

(async () => {
  if (network.name !== 'rinkeby' && network.name !== 'hardhat') {
    throw new Error(`only for rinkeby or hardhat, not for ${network.name}`);
  }
  const {deployer} = await getNamedAccounts();

  const creator = deployer;
  let to = deployer;
  if (args.length > 0) {
    to = args[0];
  }

  let packIdused = true;
  let packId = 0;
  while (packIdused) {
    packIdused = await read('Asset', 'isPackIdUsed', creator, packId, 1);
    if (packIdused) {
      console.log(`packId ${packId} used, check next...`);
      packId++;
    }
  }

  const numAssets = 2048;
  const supplies = [];
  for (let i = 0; i < numAssets; i++) {
    supplies.push(2000);
  }

  const bouncer = await ethers.getContract('DefaultMinter', creator);
  /*
    address creator,
    uint40 packId,
    bytes32 hash,
    uint256[] calldata supplies,
    address owner,
    bytes calldata data,
    uint256 feePerCopy
  */
  const tx = await bouncer.mintMultipleFor(
    creator,
    packId,
    '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
    supplies,
    to,
    '0x',
    0
  );

  console.log({txHash: tx.hash});

  const receipt = await tx.wait();

  console.log({gas: receipt.gasUsed.toString()});

  // console.log(JSON.stringify(receipt));

  const Asset = await ethers.getContract('Asset');
  const eventsMatching = await Asset.queryFilter(
    Asset.filters.TransferBatch(),
    receipt.blockNumber
  );

  const eventArgs = eventsMatching[0].args;
  if (eventArgs) {
    console.log({
      from: eventArgs.from,
      to: eventArgs.to,
      ids: eventArgs.ids.map((v: BigNumber) => v.toString()),
      // quantities: (eventArgs?[3] as any).map((v: BigNumber) => v.toString()),
    });
    if (eventArgs[3]) {
      const quantities: BigNumber[] = eventArgs[3];
      try {
        console.log({
          quantities: quantities.map((v: BigNumber) => v.toString()),
        });
      } catch (e) {
        console.error('ERROR quantities:', e);
      }
    }
  }
})();
