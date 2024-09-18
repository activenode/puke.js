import type { ZodTypeDef } from "zod";

declare module "zod" {
  interface ZodType<
    Output = any,
    Def extends ZodTypeDef = ZodTypeDef,
    Input = Output
  > {
    label(): string | undefined;
    label(label: string): this;
    placeholder(): string | undefined;
    placeholder(placeholder: string): this;
    metadata(): any;
    metadata(data: any): this;
    hide(): this;
    isHidden(): boolean;
    ___puke: true;
  }
}
