# Usage

| ⚠️ WARNING                                                                          |
| :---------------------------------------------------------------------------------- |
| This is an early alpha version. It (probably) works but is bound to change any time |

Help contributing: https://github.com/activenode/puke.js

```tsx
"use client";

import { useMemo, useState } from "react";
import { puke, zod as z } from "puke.js";

export default function MyComponent() {
  const [formState, setFormState] = useState<any>({});

  const puked = useMemo(() => {
    return puke(
      z.object({
        product_name: z.string().min(3).label("Product Name"),
        agree_to_everything: z.boolean().label("Agree to everything"),
        id: z.string().min(6).placeholder("Enter some ID"),
      })
    )
      .select(async () => {
        return {
          product_name: "foo",
        };
      })
      .withState(setFormState)
      .fieldRenderer((register, params) => {
        const inputProps = register();

        return (
          <div className="mb-4">
            <div
              className={`flex ${
                inputProps.type === "checkbox" ? "items-center" : "flex-col"
              }`}
            >
              <label
                htmlFor={inputProps.id}
                className={`text-sm font-medium text-gray-700 ${
                  inputProps.type === "checkbox" ? "order-2 ml-2" : "mb-1"
                }`}
              >
                {params.field.label()}
              </label>
              <input
                {...inputProps}
                className={
                  inputProps.type === "checkbox"
                    ? "h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    : "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                }
              />
            </div>
            <div
              {...params.errorProps}
              className="mt-2 text-sm text-red-600"
            ></div>
          </div>
        );
      })

      .validatedSubmit(async (evt, data, unsetLoading) => {
        // you can do prevent default on your own if you want
        console.log("@validatedSubmit is called, data =", data);
        return true;
      });
  }, []);

  return (
    <div>
      <puked.Form>
        {({ renderFields, state }) => {
          return (
            <div className="space-y-6">
              <fieldset className="border border-gray-300 rounded-md p-4">
                <legend className="font-bold text-lg text-gray-700 px-2">
                  Group 1
                </legend>
                <div className="space-y-4">
                  {renderFields(["product_name", "id"])}
                </div>
              </fieldset>

              <fieldset className="border border-gray-300 rounded-md p-4">
                <legend className="font-bold text-lg text-gray-700 px-2">
                  Group 2
                </legend>
                <div className="space-y-4">
                  {renderFields(["agree_to_everything"])}
                </div>
              </fieldset>

              <div className="mt-6">
                <button
                  type="submit"
                  className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Submit
                </button>
              </div>
              <pre>{JSON.stringify(state, null, 2)}</pre>
            </div>
          );
        }}
      </puked.Form>
    </div>
  );
}
```

## Why `useMemo` ?

If you don't use `useMemo`, the form factory will be rebuilt over and over again.

## Why do we need `withState(setState)`?

Simple answer: This lib is still planned to be framework-independent (right now just React).
To make sure the state syncs with your framework (here: React), you need to pass a state setter.
Also this allows to change the input values from the outside if you need to.

# Installation

`npm i puke.js`

## Use the slightly extended zod

This library uses a minimally extended zod. Zod itself has not been changed. You hence need to import zod from this library using `import { z } from 'puke.js';` (we do `export const z = zod`).
To avoid having two zod imports, make sure to always use this zod.

## make your app aware of the extended Zod

To net get typing / linting errors, create a `global.d.ts` file and add it to the `include` section of your `tsconfig.json` .

### In the `global.d.ts`

```
/// <reference types="puke.js/types/zod-extension" />
```

### tsconfig.json

E.g. next.js:

```
"include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    "global.d.ts"
  ],
```
