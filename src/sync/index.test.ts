import {
  getPort,
  spawnServer,
  generateClients,
  generateItemsInto,
  alphabet,
  awaitIsEqual
} from './test';

test('sync:init:10x3', async cb => {
  const port = getPort(0);
  const count = 10;
  const server = await spawnServer(port);
  const clients = await generateClients(port, 1);
  await Promise.all(
    [server, ...clients].map((x, i) =>
      generateItemsInto(x.db, count, `${alphabet[i]}.`)
    )
  );
  expect(await awaitIsEqual(20, server.db, ...clients.map(x => x.db))).toBe(
    true
  );
  await server.close();
  await Promise.all(clients.map(client => client.close()));
  cb();
}, 120000);

test('sync:init:10000x3', async cb => {
  const port = getPort(1);
  const count = 10000;
  const server = await spawnServer(port);
  const clients = await generateClients(port, 3);
  await generateItemsInto(server.db, count, `${alphabet[0]}.`);
  await new Promise(yay => setTimeout(yay, 3000));
  await Promise.all(
    clients.map((x, i) => generateItemsInto(x.db, count, `${alphabet[i + 1]}.`))
  );
  expect(await awaitIsEqual(20, server.db, ...clients.map(x => x.db))).toBe(
    true
  );
  await server.close();
  await Promise.all(clients.map(client => client.close()));
  cb();
}, 120000);

test('sync:init:1000x10', async cb => {
  const port = getPort(2);
  const count = 1000;
  const server = await spawnServer(port);
  const clients = await generateClients(port, 10);
  await generateItemsInto(server.db, count, `${alphabet[0]}.`);
  await new Promise(yay => setTimeout(yay, 3000));
  await Promise.all(
    clients.map((x, i) => generateItemsInto(x.db, count, `${alphabet[i + 1]}.`))
  );
  expect(await awaitIsEqual(20, server.db, ...clients.map(x => x.db))).toBe(
    true
  );
  await server.close();
  await Promise.all(clients.map(client => client.close()));
  cb();
}, 120000);

test('sync:init:multimaster', async cb => {
  const port0 = getPort(3);
  const port1 = getPort(4);
  const count = 10;
  const server0 = await spawnServer(port0);
  const server1 = await spawnServer(port1, port0);
  const clients0 = await generateClients(port0, 3);
  const clients1 = await generateClients(port1, 3);
  await Promise.all(
    [server0, server1, ...clients0, ...clients1].map((x, i) =>
      generateItemsInto(x.db, count, `${alphabet[i]}.`)
    )
  );
  expect(
    await awaitIsEqual(
      20,
      server0.db,
      server1.db,
      ...clients0.map(x => x.db),
      ...clients1.map(x => x.db)
    )
  ).toBe(true);
  await Promise.all(
    [server0, server1, ...clients0, ...clients1].map((x, i) =>
      generateItemsInto(x.db, count, `${alphabet[i]}.`)
    )
  );
  expect(
    await awaitIsEqual(
      20,
      server0.db,
      server1.db,
      ...clients0.map(x => x.db),
      ...clients1.map(x => x.db)
    )
  ).toBe(true);
  await server0.close();
  await server1.close();
  await Promise.all(clients0.map(client => client.close()));
  await Promise.all(clients1.map(client => client.close()));
  cb();
}, 120000);
