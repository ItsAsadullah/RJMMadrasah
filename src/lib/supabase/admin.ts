import { createClient } from './server';
import { isAdminUser } from '../adminAccess';

export async function createAdminClient() {
  const client = await createClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !isAdminUser(user)) throw new Error('অ্যাডমিন অনুমতি প্রয়োজন।');
  return client;
}
