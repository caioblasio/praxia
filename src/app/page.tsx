import { createClient } from '@/lib/supabase/server';

type Todo = {
  id: number;
  name: string;
};

export default async function Home() {
  const supabase = await createClient();
  const { data: todos, error } = await supabase.from('todos').select();

  if (error) {
    throw new Error(error.message);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <main className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Todos
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Fetched from Supabase</p>

        {!todos?.length ? (
          <p className="mt-8 text-zinc-600 dark:text-zinc-400">No todos yet.</p>
        ) : (
          <ul className="mt-8 space-y-2">
            {(todos as Todo[]).map((todo) => (
              <li
                key={todo.id}
                className="rounded-lg border border-zinc-200 px-4 py-3 text-zinc-900 dark:border-zinc-800 dark:text-zinc-100"
              >
                {todo.name}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
