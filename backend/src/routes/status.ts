export type ApiStatusResponse = {
  apiVersion: 'v1';
  service: 'lookup-backend';
  status: 'ok';
};

export const API_STATUS_RESPONSE: ApiStatusResponse = {
  status: 'ok',
  service: 'lookup-backend',
  apiVersion: 'v1',
};
