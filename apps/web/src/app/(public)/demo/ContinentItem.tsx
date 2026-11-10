"use client";

import type { FragmentType } from "@apollo/client";
import { useFragment } from "@apollo/client/react";
import { ContinentItem_ContinentFragmentDoc } from "@/types/__generated__/graphql";

export function ContinentItem({
  continent,
}: {
  continent: FragmentType<typeof ContinentItem_ContinentFragmentDoc>;
}) {
  const { data, complete } = useFragment({
    fragment: ContinentItem_ContinentFragmentDoc,
    from: continent,
  });

  if (!complete) return null;

  return (
    <li className="py-1">
      {data.name} <span className="text-gray-400">({data.code})</span>
    </li>
  );
}
