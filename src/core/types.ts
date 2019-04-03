export const types = {
  LISTEN: 'listen',
  INSERT: 'insert',
  GET: 'get',
  ALL: 'all',
  COUNT: 'count',
  DESTROY: 'destroy',
  REMOVE: 'remove',
  INITIALIZE: 'initialize',
  COLLECTION: 'collection'
};
interface IFieldTypeHolder {
  [s: string]: IFieldTypes;
}
export const fieldTypes: IFieldTypeHolder = {
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  STRING: 'string',
  JSON: 'json'
};
export type IFieldTypes = 'number' | 'boolean' | 'string' | 'json';
export interface IInsertItem {
  [k: string]: any;
  id?: string;
}
export interface IGetItem {
  id: string;
  rev: string;
}
export interface IItem extends IGetItem {
  [s: string]: any;
}
export interface IQuery {
  id?: string[] | string;
  explain?: boolean;
  limit?: number | [number] | [number, number];
  offset?: number;
  where?: string[] | string;
  select?: string[] | string;
  orderBy?: string[] | string;
}

export type IObserverCallback<T = IItem> = (
  items: T,
  reason: 'INITIAL' | 'CHANGE'
) => void;

export interface ICollection {
  name: string;
  index: IFields;
  fields: IFields;
  specialFields: ISpecialFields;
}

export interface ICollectionInput {
  name: string;
  index?: IFields | string[];
  fields?: IFields | string[];
  plugins?: IFields | string[];
  specialFields?: ISpecialFields;
}

export interface ISpecialFields {
  [key: string]: string;
}
export interface ICollections {
  [key: string]: ICollection;
}

export interface IFields {
  [key: string]: IFieldTypes;
}

export interface IPlugins {
  [key: string]: any[];
}
