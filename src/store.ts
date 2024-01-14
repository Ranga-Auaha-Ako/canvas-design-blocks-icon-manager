import { persisted } from 'svelte-local-storage-store'
// import categories from '$lib/icons';
// import rfdc from 'rfdc';

// const clone = rfdc();
// export const unsavedStateCategories = persisted('preferences', clone(categories))

export const nounProjectAuth = persisted('nounProjectAuth', {
  key: '',
  secret: ''
})

export const chosenCategory = persisted('chosenCategory', 0);
export const chosenIcon = persisted('chosenIcon', <null | string>null);