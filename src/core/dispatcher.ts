import { IItem, IListenerOptions } from './types';
import { Debe } from './debe';

export type listenTypes = 'get' | 'count' | 'all' | 'insert';
export type actionTypes = 'get' | 'count' | 'all' | 'insert' | 'remove';

export abstract class DebeDispatcher<TBase = IItem> {
  db: Debe;
  welcome(db: Debe) {
    this.db = db;
  }
  abstract close(): Promise<void>;
  abstract initialize(): Promise<void>;
  abstract run<T = TBase>(
    action: actionTypes,
    collection: string,
    payload?: any,
    options?: any
  ): Promise<T>;
  abstract listen<T = TBase>(
    action: listenTypes,
    callback: (value: T) => void,
    options: IListenerOptions
  ): () => void;
}
