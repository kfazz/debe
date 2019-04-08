import {
  IGetItem,
  IQuery,
  DebeAdapter,
  ICollections,
  FilterReducer,
  ensureArray
} from 'debe';

interface IStore {
  [s: string]: Map<string, IGetItem>;
}

export function pluck(sourceObject: IGetItem, keys: string[] = []): IGetItem {
  if (!sourceObject) {
    return sourceObject;
  }
  const newObject = {
    id: sourceObject.id,
    rev: sourceObject.rev
  };
  for (var key of keys) {
    newObject[key] = sourceObject[key];
  }
  return newObject;
}

export class MemoryAdapter extends DebeAdapter {
  private store: IStore = {};
  filter = createMemoryFilter().filter;
  initialize(collections: ICollections) {
    for (var key in collections) {
      const collection = collections[key];
      this.store[collection.name] = new Map();
    }
  }
  get(collection: string, id: string) {
    const item = this.store[collection].get(id);
    return Promise.resolve(item ? { ...item } : item);
  }
  all(collection: string, query: IQuery) {
    let items = Array.from(this.store[collection].values());
    if (query.where) {
      items = items.filter(this.filter(query.where));
    }
    if (query.orderBy) {
      items = sortArray(items, query.orderBy);
    }
    if (query.offset) {
      items = items.slice(query.offset);
    }
    if (query.limit) {
      items = items.slice(0, query.limit);
    }
    if (query.select) {
      items = items.map(x => pluck(x, query.select));
    }
    return Promise.resolve([...items]);
  }
  count(collection: string, query: IQuery) {
    delete query.orderBy;
    return this.all(collection, query).then(x => x.length);
  }
  insert(collection: string, items: any[]) {
    items.forEach((x: any) => this.handle(collection, x));
    return Promise.resolve(items);
  }
  remove(collection: string, ids: string[]) {
    ids.forEach(id => this.store[collection].delete(id));
    return Promise.resolve(ids);
  }
  // Helpers
  private handle(type: string, item: IGetItem) {
    this.store[type].set(item.id, item);
    return item;
  }
}

export const createMemoryFilter = () =>
  new FilterReducer<any, boolean>({
    '!=': (col, field, value) => (col[field] || null) != (value || null),
    '<': (col, field, value) => col[field] < value,
    '<=': (col, field, value) => col[field] <= value,
    '=': (col, field, value) => (col[field] || null) == (value || null),
    '>': (col, field, value) => col[field] > value,
    '>=': (col, field, value) => col[field] >= value,
    IN: (col, field, value) => ensureArray(value).indexOf(col[field]) >= 0,
    'NOT IN': (col, field, value) => ensureArray(value).indexOf(col[field]) < 0,
    'IS NULL': (col, field) => (col[field] || null) === null
  });

export function sortArray(arr: any[], orderer: string | string[]): any[] {
  if (Array.isArray(orderer)) {
    return orderer.reduce((arr, str) => sortArray(arr, str), arr);
  }
  const [fieldName = '', direction = ''] = (orderer || '').split(' ');
  if (fieldName) {
    const isDesc = direction.toUpperCase() === 'DESC';
    const compare = (a: any, b: any) => {
      if (a[fieldName] < b[fieldName]) return isDesc ? 1 : -1;
      if (a[fieldName] > b[fieldName]) return isDesc ? -1 : 1;
      return 0;
    };
    return arr.sort(compare);
  }
  return arr;
}
