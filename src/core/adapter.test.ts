import { Debe, softDeletePlugin } from 'debe';
import { generate } from './utils';
import { ICollectionInput } from './types';
import { DebeAdapter } from './adapter';

test('adapter:test', async () => {
  expect(1).toBe(1);
});

export function createAdapterTest(
  name: string,
  createAdapter: (i: number) => DebeAdapter | any,
  init: (
    collections: ICollectionInput[],
    i: number
  ) => Promise<() => void> = () => Promise.resolve(() => {})
) {
  test(`${name}:basic`, async () => {
    const collections = [
      { name: 'lorem' + generate().substr(0, 4), index: ['name'] }
    ];
    const ini = await init(collections, 0);
    const table = collections[0].name;
    const client = new Debe(createAdapter(0), collections);
    await client.initialize();
    const insertResult = await client.insert<any>(table, {
      id: 'asd0',
      name: 'Hallo'
    });
    const queryResult = await client.all<any>(table);
    expect(insertResult.id).toBe('asd0');
    expect(insertResult.name).toBe('Hallo');
    expect(Array.isArray(queryResult)).toBe(true);
    expect(queryResult.length).toBe(1);
    expect(queryResult[0].id).toBe(insertResult.id);
    expect(queryResult[0].name).toBe(insertResult.name);
    await client.destroy();
    await ini();
  });

  test(`${name}:select`, async () => {
    const collections = [
      { name: 'lorem' + generate().substr(0, 4), index: ['name'] }
    ];
    const ini = await init(collections, 0);
    const table = collections[0].name;
    const client = new Debe(createAdapter(0), collections);
    await client.initialize();
    const insertResult = await client.insert<any>(table, {
      id: 'asd0',
      name: 'Hallo'
    });
    const queryResult = await client.all<any>(table, { select: 'id' });
    expect(insertResult.id).toBe('asd0');
    expect(insertResult.name).toBe('Hallo');
    expect(Array.isArray(queryResult)).toBe(true);
    expect(queryResult.length).toBe(1);
    expect(queryResult[0].id).toBe(insertResult.id);
    expect(queryResult[0].name).toBe(undefined);
    await client.destroy();
    await ini();
  });

  test(`${name}:many`, async () => {
    const collections = [
      { name: 'lorem' + generate().substr(0, 4), index: ['name'] }
    ];
    const ini = await init(collections, 1);
    const table = collections[0].name;
    const client = new Debe(createAdapter(1), collections);
    await client.initialize();
    const items = [];
    for (let x = 0; x < 100; x++) {
      items.push({ id: 'a' + (x < 10 ? `0${x}` : x) });
    }
    await client.insert(table, items);
    let result = await client.all(table, {
      where: ['id < ?', 'a50']
    } as any);
    expect(result.length).toBe(50);
    result = await client.all(table, {
      where: ['id >= ?', 'a50']
    } as any);
    expect(result.length).toBe(50);
    result = await client.all(table, {
      orderBy: ['id ASC'],
      limit: 5
    } as any);
    expect(result.length).toBe(5);
    expect(result[0].id).toBe('a00');
    expect(result[4].id).toBe('a04');
    result = await client.all(table, {
      orderBy: ['id ASC'],
      limit: 6,
      offset: 5
    } as any);
    expect(result.length).toBe(6);
    expect(result[0].id).toBe('a05');
    expect(result[4].id).toBe('a09');
    const single = await client.get(table, {
      where: ['id <= ?', 'a50'],
      orderBy: ['id ASC']
    } as any);
    expect(single).toBeTruthy();
    expect(single.id).toBe('a00');
    await client.destroy();
    await ini();
  }, 10000);

  test(`${name}:insert`, async () => {
    const collections = [
      { name: 'lorem' + generate().substr(0, 4), index: ['name'] }
    ];
    const ini = await init(collections, 1);
    const table = collections[0].name;
    const client = new Debe(createAdapter(1), collections);
    await client.initialize();
    async function isMatch(item?: any) {
      const single = item || (await client.get(table, 'a0'));
      return (
        single &&
        single.id === 'a0' &&
        single.fieldBool === true &&
        single.fieldString === 'abc' &&
        single.fieldNumber === 5
      );
    }
    const single = await client.insert(table, {
      id: 'a0',
      fieldString: 'abc',
      fieldBool: true,
      fieldNumber: 5
    });
    expect(await isMatch(single)).toBe(true);
    expect(await isMatch()).toBe(true);
    const newItem = await client.insert(
      table,
      {
        id: 'a0',
        newField: 'abc2'
      },
      { update: true }
    );
    expect(await isMatch()).toBe(true);
    expect(newItem.newField).toBe('abc2');
    expect((await client.get(table, 'a0')).newField).toBe('abc2');
    await client.destroy();
    await ini();
  }, 10000);

  test(`${name}:change`, async () => {
    const collections = [
      { name: 'lorem' + generate().substr(0, 4), index: ['name'] }
    ];
    const ini = await init(collections, 2);
    const table = collections[0].name;
    const client = new Debe(createAdapter(2), collections);
    await client.initialize();
    let calls = 0;
    let countCalls = 0;
    const unlisten = client.all(table, {}, () => (calls = calls + 1));
    const unlisten2 = client.count(
      table,
      {},
      () => (countCalls = countCalls + 1)
    );
    await client.insert(table, { id: '0', name: 'Hallo' });
    await client.insert(table, { id: '1', name: 'Hallo' });
    unlisten();
    unlisten2();
    await client.insert(table, { id: '2', name: 'Hallo' });
    expect(calls).toBe(2);
    expect(countCalls).toBe(2);
    await client.destroy();
    await ini();
  });

  test(`${name}:softdelete`, async () => {
    const collections = [
      { name: 'lorem' + generate().substr(0, 4), index: ['name'] }
    ];
    const ini = await init(collections, 3);
    const table = collections[0].name;
    const client = new Debe(createAdapter(3), collections);
    if (ini['db']) {
      softDeletePlugin()(ini['db']);
    } else {
      softDeletePlugin()(client);
    }
    await client.initialize();
    await client.insert(table, { id: 'asd0', name: 'Hallo' });
    await client.insert(table, { id: 'asd1', name: 'Hallo' });
    await client.remove(table, 'asd0');
    const all0 = await client.all(table, { where: ['id != ?', 'asd2'] });
    const all1 = await client.all(table, {});
    const item0 = await client.get(table, { id: 'asd0' });
    expect(all0.length).toBe(1);
    expect(all1.length).toBe(1);
    expect(item0).toBeTruthy();
    expect(item0.id).toBe('asd0');
    await client.destroy();
    await ini();
  });
}
