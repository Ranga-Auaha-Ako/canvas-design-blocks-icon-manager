import { writable } from 'svelte-local-storage-store'
// import categories from '$lib/icons';
// import rfdc from 'rfdc';

// const clone = rfdc();
// export const unsavedStateCategories = writable('preferences', clone(categories))

export const nounProjectAuth = writable('nounProjectAuth', {
  key: '',
  secret: ''
})

export const chosenCategory = writable('chosenCategory', 0);
export const chosenIcon = writable('chosenIcon', <null | string>null);