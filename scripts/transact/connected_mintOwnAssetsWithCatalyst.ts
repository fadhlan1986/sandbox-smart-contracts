import {BigNumber} from 'ethers';
import {parseEther} from 'ethers/lib/utils';
import {getNamedAccounts, ethers, network, deployments} from 'hardhat';

const {read, execute, rawTx} = deployments;

const args = process.argv.slice(2);

(async () => {
  if (network.name !== 'rinkeby' && network.name !== 'hardhat') {
    throw new Error(`only for rinkeby or hardhat, not for ${network.name}`);
  }
  const {deployer, catalystMinter, gemMinter} = await getNamedAccounts();

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

  const numLegendary = 400;
  const gemsQuantities = [
    numLegendary,
    numLegendary,
    numLegendary,
    numLegendary,
  ];
  const catalystsQuantities = [0, 0, 0, numLegendary];
  const assets = [];
  for (let i = 0; i < numLegendary; i++) {
    assets.push({
      gemIds: [0, 1, 2, 3],
      quantity: 2000,
      catalystId: 3,
    });
  }

  await rawTx({from: deployer, to: gemMinter, value: parseEther('0.5')});

  await execute(
    'Gem',
    {from: gemMinter, log: true},
    'batchMint',
    creator,
    [0, 1, 2, 3],
    gemsQuantities
  );
  await execute(
    'Catalyst',
    {from: catalystMinter, log: true},
    'batchMint',
    creator,
    [3],
    [catalystsQuantities[3]]
  );

  const bouncer = await ethers.getContract('SandboxMinter', creator);
  const tx = await bouncer.mintMultiple(
    creator,
    packId,
    '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
    gemsQuantities,
    catalystsQuantities,
    assets,
    to,
    '0x'
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
