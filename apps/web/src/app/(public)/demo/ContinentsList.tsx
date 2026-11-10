"use client";

import { useSuspenseQuery } from "@apollo/client/react";
import { GetContinentsDocument } from "@/types/__generated__/graphql";
import { ContinentItem } from "./ContinentItem";

export function ContinentsList() {
  const { data } = useSuspenseQuery(GetContinentsDocument);

  return (
    <ul>
      {data.continents.map((continent) => (
        <ContinentItem key={continent.code} continent={continent} />
      ))}
    </ul>
  );
}
