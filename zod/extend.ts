import "../zod-globals.d.ts";
import { ZodType } from "zod";

if (!ZodType.prototype.___puke) {
  ZodType.prototype.___puke = true;

  ZodType.prototype.label = function (this: ZodType, label?: string) {
    if (label === undefined) {
      // If no label is provided, return the current label
      return (this as any)._def.label;
    } else {
      // If a label is provided, set it and return this for chaining
      (this as any)._def.label = label;
      return this;
    }
  };

  ZodType.prototype.placeholder = function (
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

  ZodType.prototype.metadata = function (this: ZodType, data?: any) {
    if (data === undefined) {
      return (this as any)._def.metadata;
    } else {
      // If a data is provided, set it and return this for chaining
      (this as any)._def.metadata = data;
      return this;
    }
  };
}
