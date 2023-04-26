import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";

export async function loader({ request }: LoaderArgs) {
const searchParams = new URL(request.url).searchParams as any;
const { filter } = Object.fromEntries(searchParams.entries());

return json({ filter });
}

export default function CreditCard() {
const { filter } = useLoaderData<{ filter?: string; }>();

  return (
  <div className="sm:px-6 lg:px-8">
    <div className="flex items-center justify-between">
      <div className="sm:flex-auto">
        <h1 className="text-xl font-semibold text-gray-900">CreditCard</h1>
        <p className="mt-2 text-sm text-gray-700">
          A list of all the CreditCard.
        </p>
      </div>
      <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
        <button type="button"
          className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-1 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto">
          Add CreditCard
        </button>
      </div>
    </div>
  </div>
  );
  }