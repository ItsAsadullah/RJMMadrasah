import { createAdminClient } from '@/lib/supabase/admin';

export default async function MessagesPage() {
  const client = await createAdminClient();
  const { data, error } = await client.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(100);
  return <section className="mx-auto max-w-4xl space-y-4 p-4">
    <h1 className="text-2xl font-bold">যোগাযোগের বার্তা</h1>
    <p className="text-sm text-gray-600">সর্বশেষ ১০০টি বার্তা</p>
    {error ? <p role="alert">বার্তা লোড করা যায়নি। পরে আবার চেষ্টা করুন।</p> : !data?.length ? <p>এখনো কোনো বার্তা নেই।</p> : data.map(item =>
      <article key={item.id} className="rounded-xl border bg-white p-5 space-y-2">
        <h2 className="font-bold">{item.subject}</h2>
        <p>{item.name} · {item.phone} {item.email && `· ${item.email}`}</p>
        <time className="text-sm text-gray-500">{new Date(item.created_at).toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' })}</time>
        <p className="whitespace-pre-wrap break-words">{item.message}</p>
      </article>)}
  </section>;
}
