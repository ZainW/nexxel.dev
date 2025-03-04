import React, { useState } from "react";
import { generateSlug } from "random-word-slugs";
import { debounce } from "debounce";
import clsx from "clsx";
import { BsCheck2 } from "react-icons/bs";
import { FiClipboard } from "react-icons/fi";

import { trpc } from "../utils/trpc";

type Form = {
  slug: string;
  url: string;
};

const CreateLink = ({ origin }: { origin: string }) => {
  const url = origin + "/r";
  const [form, setForm] = useState<Form>({ slug: "", url: "" });
  const [copied, setCopied] = useState(false);

  const checkSlug = trpc.shortener.checkSlug.useQuery(
    {
      slug: form.slug,
    },
    {
      refetchOnReconnect: false,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    }
  );

  const createShortLink = trpc.shortener.create.useMutation();

  if (createShortLink.status === "success") {
    return (
      <div className="flex flex-col items-center justify-center mx-3 mt-6">
        <span className="pb-3 text-lg font-semibold">
          Here&apos;s your link!
        </span>

        <div className="flex items-center gap-2 p-4 border-2 rounded-md border-t-pink bg-zinc-800">
          <h2 className="text-lg text-center md:text-2xl">{`${url}/${form.slug}`}</h2>
          <button
            className="px-2 py-2 ml-2 transition-colors duration-300 border-2 rounded-md cursor-pointer border-t-pink text-t-pink hover:bg-t-pink hover:bg-opacity-30"
            onClick={() => {
              setCopied(true);
              navigator.clipboard.writeText(`https://${url}/${form.slug}`);
              setTimeout(() => {
                setCopied(false);
              }, 3000);
            }}
          >
            {copied ? <BsCheck2 /> : <FiClipboard />}
          </button>
        </div>

        <button
          className="px-4 py-2 mt-5 transition-colors duration-300 border-2 rounded-md cursor-pointer border-t-pink border-opacity-80 hover:bg-t-pink hover:bg-opacity-30 hover:text-white"
          onClick={() => {
            createShortLink.reset();
            setForm({ slug: "", url: "" });
          }}
        >
          Create New
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        createShortLink.mutate({ ...form });
      }}
      className="mt-6"
    >
      {checkSlug.data?.used ? (
        <span className="font-medium text-center text-t-red">
          This link is not available
        </span>
      ) : (
        <span className="font-medium text-center">
          {url}/{form.slug}
        </span>
      )}

      <div className="my-2" />

      <div className="flex items-center">
        <input
          type="text"
          onChange={(e) => {
            setForm({
              ...form,
              slug: e.target.value.toLowerCase(),
            });

            debounce(checkSlug.refetch, 100);
          }}
          minLength={1}
          maxLength={20}
          placeholder="cat-in-hat"
          className={clsx(
            "w-full rounded-md border-2 bg-zinc-800 px-4 py-2 font-normal placeholder:text-gray-400 focus:outline-none",
            checkSlug.data?.used
              ? "border-t-red border-opacity-75"
              : "border-gray-200"
          )}
          value={form.slug}
          pattern={"^[-a-zA-Z0-9]+$"}
          title="Only alphanumeric characters and hyphens are allowed. No spaces."
          required
        />

        <input
          type="button"
          value="Random"
          className="px-4 py-2 ml-2 transition-colors duration-300 border-2 rounded-md cursor-pointer border-t-pink border-opacity-80 hover:bg-t-pink hover:bg-opacity-30 hover:text-white"
          onClick={() => {
            const slug = generateSlug();

            setForm({
              ...form,
              slug,
            });

            checkSlug.refetch();
          }}
        />
      </div>
      <div className="flex flex-col items-center my-2">
        <span className="self-start my-2 font-medium">Link</span>
        <input
          type="url"
          value={form.url}
          maxLength={3000}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
          placeholder="https://duckduckgo.com"
          className="block w-full px-4 py-2 font-normal border-2 border-gray-200 rounded-md bg-zinc-800 placeholder:text-gray-400 focus:outline-none"
          required
        />
      </div>
      <input
        type="submit"
        value={createShortLink.status === "loading" ? "Creating" : "Create"}
        className={clsx(
          "umami--click--create-shortlink cursor-pointer rounded-md border-2 border-t-pink border-opacity-80 px-6 py-2 transition-colors duration-300 hover:bg-t-pink hover:bg-opacity-30 hover:text-white",
          createShortLink.status === "loading" ? "opacity-50" : ""
        )}
        disabled={checkSlug.isFetched && checkSlug.data!.used}
      />
    </form>
  );
};

export default CreateLink;
