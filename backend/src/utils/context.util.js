import { AsyncLocalStorage } from 'async_hooks';

export const requestContext = new AsyncLocalStorage();

export const CONTEXT_KEYS = {
  REQUEST_ID: 'requestId',
  USER_ID: 'userId'
};

const getStore = () => requestContext.getStore();

export const getRequestId = () => {
  return getStore()?.get(CONTEXT_KEYS.REQUEST_ID) || 'unknown';
};

export const getUserId = () => {
  return getStore()?.get(CONTEXT_KEYS.USER_ID);
};

export const setRequestId = (id) => {
  const store = getStore();
  if (store) store.set(CONTEXT_KEYS.REQUEST_ID, id);
};

export const setUserId = (id) => {
  const store = getStore();
  if (store) store.set(CONTEXT_KEYS.USER_ID, id);
};

export const getLogContext = () => ({
  requestId: getRequestId(),
  userId: getUserId()
});

export const runWithContext = (data, fn) => {
  const store = new Map(Object.entries(data));
  return requestContext.run(store, fn);
};
