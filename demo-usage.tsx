import { useMemo } from "react";
import { puke } from "./index";
import { z } from "zod";

export function DemoUsage() {
  const memo = useMemo(() => {
    puke(
      z.object({
        is_live: z.boolean().label("Is live"),
        date: z.date().label("Date"),
      })
    ).validatedSubmit(async (evt, data, unsetLoading) => {
      const b: boolean = data.is_live;
      const d: Date = data.date;

      return true;
    });
  }, []);
}
