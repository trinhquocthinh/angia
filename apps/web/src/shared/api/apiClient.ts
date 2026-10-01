import createClient from 'openapi-fetch';
import type { paths } from './schema.gen';

// Client contract-first: kiểu sinh từ OpenAPI của apps/api qua `yarn generate:api`.
export const apiClient = createClient<paths>({ baseUrl: '/', credentials: 'same-origin' });
