import "../zod-globals.d.ts";
import zod from "zod";
import type { ZodType } from "zod";

export function extendZod(z: typeof zod) {
  if (!z.ZodType.prototype.___puke) {
    z.ZodType.prototype.___puke = true;

    z.ZodType.prototype.hide = function (this: ZodType) {
      (this as any)._def.hidden = true;
      return this;
    };

    z.ZodType.prototype.isHidden = function (this: ZodType) {
      return (this as any)._def.hidden === true;
    };

    z.ZodType.prototype.label = function (this: ZodType, label?: string) {
      if (label === undefined) {
        // If no label is provided, return the current label
        return (this as any)._def.label;
      } else {
        // If a label is provided, set it and return this for chaining
        (this as any)._def.label = label;
        return this;
      }
    };

    z.ZodType.prototype.placeholder = function (
      this: ZodType,
      placeholder?: string
    ) {
      if (placeholder === undefined) {
        // If no placeholder is provided, return the current placeholder
        return (this as any)._def.placeholder;
      } else {
        // If a placeholder is provided, set it and return this for chaining
        (this as any)._def.placeholder = placeholder;
        return this;
      }
    };

    z.ZodType.prototype.metadata = function (this: ZodType, data?: any) {
      if (data === undefined) {
        return (this as any)._def.metadata;
      } else {
        // If a data is provided, set it and return this for chaining
        (this as any)._def.metadata = data;
        return this;
      }
    };
  }
}
