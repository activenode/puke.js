import React, { useEffect, useId } from "react";
import z from "zod";

import "./zod/extend";

export { extendZod } from "./zod/extend";

export type ValidDerivedInputTypes =
  | "checkbox"
  | "number"
  | "text"
  | "email"
  | "password"
  | "select"
  | "textarea"
  | "date"
  | "hidden"
  | "url";

export type FormState<T extends z.ZodRawShape> = {
  fieldValues: {
    [K in keyof T]: T[K] extends z.ZodBoolean
      ? boolean
      : T[K] extends z.ZodNumber
      ? number
      : T[K] extends z.ZodDate
      ? Date
      : string;
  };
  errors: Partial<
    Record<
      keyof z.infer<z.ZodObject<T>>,
      {
        message: string;
      }
    >
  >;
  loading: boolean;
};

export type FieldRendererParams<T extends z.ZodRawShape> = {
  field_name: keyof z.infer<z.ZodObject<T>>;
  isRequired: boolean;
  field: z.ZodType<any>;
  onChange: (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;
  inputType: ValidDerivedInputTypes;
  errors: FormState<T>["errors"][keyof z.infer<z.ZodObject<T>>];
  errorProps?: {
    id: string;
    children: string | undefined;
    role: "alert";
    "aria-hidden": "true" | "false";
  };
  options?: string[];
};

export type FieldRenderer<T extends z.ZodRawShape> = (
  register: () => {
    id: string;
    name: string;
    value: any;
    onChange: (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => void;
    type: ValidDerivedInputTypes;
    checked?: boolean;
    placeholder?: string;
    "aria-required"?: "true";
    "aria-invalid"?: "true";
    "aria-describedby"?: string;
    disabled?: boolean;
  },
  params: FieldRendererParams<T>,
  state: FormState<T>
) => React.ReactNode;

export type PukedObjType<T extends z.ZodRawShape> = {
  withState: (stateSetter: (state: FormState<T>) => void) => PukedObjType<T>;
  select: (
    selectDataFn: (
      fieldNames: Array<keyof z.infer<z.ZodObject<T>>>
    ) => Promise<Partial<Record<keyof z.infer<z.ZodObject<T>>, any>>>
  ) => PukedObjType<T>;
  validatedSubmit: (
    onSubmit: (
      evt: React.FormEvent<HTMLFormElement>,
      data: FormState<T>["fieldValues"],
      unsetLoading: () => void
    ) => Promise<boolean>
  ) => PukedObjType<T>;
  _state: FormState<T>;
  plugin: (pluginFn: (obj: PukedObjType<T>) => void) => PukedObjType<T>;
  getFieldNames: () => ReadonlyArray<keyof z.infer<z.ZodObject<T>>>;
  dontPreventDefault: () => PukedObjType<T>;
  fieldRenderer: (renderer: FieldRenderer<T>) => PukedObjType<T>;
  Form: (props: {
    children: (params: {
      renderFields: (
        fieldNames?: Array<keyof z.infer<z.ZodObject<T>>>
      ) => React.ReactNode;
      formId: string;
      loading: boolean;
      state: FormState<T>;
    }) => React.ReactNode;
  }) => React.ReactNode;
};

export const puke = <T extends z.ZodRawShape>(
  fields: z.ZodObject<T>
): PukedObjType<T> => {
  let _validatedSubmit: Parameters<
    PukedObjType<T>["validatedSubmit"]
  >[0] = () => Promise.resolve(true);

  type ZodObjectKeys = keyof z.infer<z.ZodObject<T>>;

  let _state: FormState<T> = {
    fieldValues: {} as FormState<T>["fieldValues"],
    errors: {},
    loading: true,
  };

  let _doPreventDefault = true;

  let _selectDataFn: (
    fieldNames: Array<ZodObjectKeys>
  ) => Promise<Partial<Record<ZodObjectKeys, any>>> = async () =>
    ({} as Record<ZodObjectKeys, any>);

  let _setState = (state: FormState<T>) => {
    _state = state;
  };

  const _updateState = (state: FormState<T>) => {
    _state = state;
    _setState(_state);
  };

  const _updateIsLoading = (loading: boolean) => {
    _state = { ..._state, loading };
    _setState(_state);
  };

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = event.target;
    let fieldValue: any;

    if (type === "checkbox") {
      fieldValue = (event.target as HTMLInputElement).checked;
    } else if (type === "number") {
      fieldValue = parseFloat(value);
    } else if (type === "date") {
      fieldValue = new Date(value);
    } else {
      fieldValue = value;
    }

    _updateState({
      ..._state,
      fieldValues: {
        ..._state.fieldValues,
        [name]: fieldValue,
      } as FormState<T>["fieldValues"],
    });
  };

  let FieldRendererComp: FieldRenderer<T> = (register, params) => {
    throw new Error("FieldRendererComp not implemented");
    return <></>;
  };

  const pukedObj: PukedObjType<T> = {
    withState: function (stateSetter: (state: FormState<T>) => void) {
      _setState = stateSetter;
      return this;
    },
    fieldRenderer(renderer) {
      FieldRendererComp = renderer;
      return this;
    },
    select: function (selectDataFn) {
      _selectDataFn = selectDataFn;
      return this;
    },
    validatedSubmit: function (onSubmit) {
      _validatedSubmit = onSubmit;
      return this;
    },
    dontPreventDefault: function () {
      _doPreventDefault = false;
      return this;
    },
    _state,
    Form: ({ children }) => {
      const formId = useId();

      useEffect(() => {
        _updateIsLoading(true);

        const fieldNames = Object.keys(fields.shape) as Array<ZodObjectKeys>;
        _selectDataFn(fieldNames).then((data) => {
          _updateIsLoading(false);

          _updateState({
            ..._state,
            fieldValues: {
              ..._state.fieldValues,
              ...data,
            } as FormState<T>["fieldValues"],
          });
        });
      }, []);

      return (
        <form
          id={formId}
          onSubmit={(e) => {
            _doPreventDefault && e.preventDefault();
            const validationResult = fields.safeParse(_state.fieldValues);

            if (validationResult.success) {
              _updateState({
                ..._state,
                fieldValues: validationResult.data,
                errors: {},
                loading: true,
              });

              _validatedSubmit(e, validationResult.data, () => {
                _updateIsLoading(false);
              });
            } else {
              const collectedErrors: FormState<T>["errors"] =
                validationResult.error.errors.reduce((acc, errorItem) => {
                  acc[errorItem.path[0] as ZodObjectKeys] = {
                    message: errorItem.message,
                  };

                  return acc;
                }, {} as FormState<T>["errors"]);

              _updateState({
                ..._state,
                errors: collectedErrors,
              });
            }
          }}
        >
          {children({
            loading: _state.loading,
            formId,
            state: _state,
            renderFields(fieldNames) {
              let fieldsToRender = Object.entries(fields.shape);

              if (Array.isArray(fieldNames)) {
                fieldsToRender = fieldNames
                  .map((fieldName) =>
                    fieldsToRender.find(([key]) => key === fieldName)
                  )
                  .filter((field) => !!field);
              }

              return (
                <>
                  {fieldsToRender.map(([key, field]) => {
                    let inputType: ValidDerivedInputTypes = "text";
                    let options: string[] = [];
                    const isRequired = field.isOptional() ? false : true;
                    const isHidden = field.isHidden();

                    if (field instanceof z.ZodBoolean) {
                      inputType = "checkbox";
                    } else if (field instanceof z.ZodNumber) {
                      inputType = "number";
                    } else if (field instanceof z.ZodDate) {
                      inputType = "date";
                    } else if (field instanceof z.ZodEnum) {
                      inputType = "select";
                      options = field._def.values;
                    } else if (field instanceof z.ZodString) {
                      if (
                        field._def.checks.some(
                          (check) => check.kind === "email"
                        )
                      ) {
                        inputType = "email";
                      } else if (
                        field._def.checks.some((check) => check.kind === "url")
                      ) {
                        inputType = "url";
                      } else if (
                        field._def.checks.some((check) => check.kind === "uuid")
                      ) {
                        inputType = "text";
                      }
                    }

                    if (isHidden) {
                      inputType = "hidden";
                    }

                    const hasError = !!_state.errors[key as ZodObjectKeys];
                    const errElemId = `${formId}-${key}-error`;

                    const register: Parameters<FieldRenderer<T>>[0] = () => {
                      return {
                        id: `${formId}-${key}`,
                        name: key,
                        value: _state.fieldValues[key as ZodObjectKeys],
                        onChange: handleChange,
                        type: inputType,
                        checked:
                          inputType === "checkbox"
                            ? Boolean(
                                _state.fieldValues[
                                  key as ZodObjectKeys
                                ] as boolean
                              ) ?? false
                            : undefined,
                        placeholder: field.placeholder?.() ?? "",
                        "aria-required": isRequired ? "true" : undefined,
                        "aria-invalid": hasError ? "true" : undefined,
                        "aria-describedby": hasError ? errElemId : undefined,
                        disabled: _state.loading,
                      };
                    };

                    return (
                      <React.Fragment key={key}>
                        {FieldRendererComp(
                          register,
                          {
                            isRequired,
                            field_name: key as ZodObjectKeys,
                            field,
                            onChange: handleChange,
                            inputType,
                            errors: _state.errors[key as ZodObjectKeys],
                            errorProps: {
                              id: errElemId,
                              children:
                                _state.errors[key as ZodObjectKeys]?.message,
                              role: "alert",
                              "aria-hidden": hasError ? "false" : "true",
                            },
                            options,
                          },
                          _state
                        )}
                      </React.Fragment>
                    );
                  })}
                </>
              );
            },
          })}
        </form>
      );
    },
    plugin(pluginFn) {
      pluginFn(pukedObj);
      return this;
    },
    getFieldNames: function () {
      return Object.keys(fields.shape) as ReadonlyArray<
        keyof z.infer<z.ZodObject<T>>
      >;
    },
  };

  return pukedObj;
};
