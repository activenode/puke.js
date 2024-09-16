import React, { useEffect, useId, useMemo, useState } from "react";

import z from "zod";
import "./zod/extend";

type ValidDerivedInputTypes =
  | "checkbox"
  | "number"
  | "text"
  | "email"
  | "password"
  | "select"
  | "textarea"
  | "date"
  | "url";

export const zod = z;

export const puke = <T extends z.ZodRawShape>(fields: z.ZodObject<T>) => {
  // Infer the type from the Zod schema
  type FormData = z.infer<typeof fields>;
  type FormFieldNames = keyof FormData;
  type FormDataRecord = Record<FormFieldNames, string>;
  type FormState = {
    fieldValues: Record<FormFieldNames, string>;
    errors: Partial<
      Record<
        FormFieldNames,
        {
          message: string;
        }
      >
    >;
    loading: boolean;
  };

  type FieldRendererParams = {
    field_name: FormFieldNames;
    field: z.ZodType<any>;
    onChange: (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => void;
    inputType: ValidDerivedInputTypes;
    errors: FormState["errors"][FormFieldNames];
    errorProps?: {
      id: string;
      children: string | undefined;
      role: "alert";
      "aria-hidden": "true" | "false";
    };
  };
  type FieldRenderer = (
    register: () => {
      id: string;
      name: string;
      value: string;
      onChange: (
        event: React.ChangeEvent<
          HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
      ) => void;
      type: ValidDerivedInputTypes;
    },
    params: FieldRendererParams
  ) => React.ReactNode;

  let _validatedSubmit: (
    evt: React.FormEvent<HTMLFormElement>,
    data: FormDataRecord,
    unsetLoading: () => void
  ) => Promise<boolean> = () => Promise.resolve(true);

  let _state: FormState = {
    fieldValues: {} as FormDataRecord,
    errors: {},
    loading: true,
  };

  let _doPreventDefault = true;

  let _selectDataFn: (
    fieldNames: Array<FormFieldNames>
  ) => Promise<Partial<Record<FormFieldNames, any>>> = async () =>
    ({} as FormDataRecord);

  let _setState = (state: FormState) => {
    _state = state;
  };

  type PukedObjType = {
    withState: (stateSetter: (state: FormState) => void) => PukedObjType;
    select: (selectDataFn: typeof _selectDataFn) => PukedObjType;
    validatedSubmit: (onSubmit: typeof _validatedSubmit) => PukedObjType;
    _state: FormState;
    plugin: (pluginFn: (obj: PukedObjType) => void) => PukedObjType;
    getFieldNames: () => ReadonlyArray<FormFieldNames>;
    dontPreventDefault: () => PukedObjType;
    fieldRenderer: (renderer: FieldRenderer) => PukedObjType;
    Form: (props: {
      children: (params: {
        renderFields: (fieldNames?: Array<FormFieldNames>) => React.ReactNode;
        formId: string;
        loading: boolean;
        state: FormState;
      }) => React.ReactNode;
    }) => React.ReactNode;
  };

  const _updateState = (state: FormState) => {
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
    let fieldValue: string | boolean;

    if (type === "checkbox") {
      fieldValue = (event.target as HTMLInputElement).checked;
    } else {
      fieldValue = value;
    }

    _updateState({
      ..._state,
      fieldValues: {
        ..._state.fieldValues,
        [name]: fieldValue,
      },
    });
  };

  let FieldRendererComp: FieldRenderer = (register, params) => {
    throw new Error("FieldRendererComp not implemented");
    return <></>;
  };

  const pukedObj: PukedObjType = {
    withState: function (stateSetter: (state: FormState) => void) {
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

        const fieldNames = Object.keys(fields.shape) as Array<FormFieldNames>;
        _selectDataFn(fieldNames).then((data) => {
          _updateIsLoading(false);

          _updateState({
            ..._state,
            fieldValues: {
              ..._state.fieldValues,
              ...data,
            },
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
              const collectedErrors: FormState["errors"] =
                validationResult.error.errors.reduce((acc, errorItem) => {
                  acc[errorItem.path[0] as FormFieldNames] = {
                    message: errorItem.message,
                  };

                  return acc;
                }, {} as FormState["errors"]);

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
                fieldsToRender = fieldsToRender.filter(([key]) =>
                  fieldNames.includes(key as FormFieldNames)
                );
              }

              return (
                <>
                  {fieldsToRender.map(([key, field]) => {
                    let inputType: ValidDerivedInputTypes = "text"; // Default input type
                    let options: string[] = [];
                    const isRequired = field.isOptional() ? false : true;

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

                    const hasError = !!_state.errors[key];
                    const errElemId = `${formId}-${key}-error`;

                    const register = () => {
                      return {
                        id: `${formId}-${key}`,
                        name: key,
                        value:
                          inputType === "checkbox"
                            ? "on"
                            : _state.fieldValues[key] ?? "",
                        onChange: handleChange,
                        type: inputType,
                        checked:
                          inputType === "checkbox"
                            ? _state.fieldValues[key] ?? false
                            : undefined,
                        placeholder: field.placeholder() ?? "",
                        "aria-required": isRequired ? "true" : undefined,
                        "aria-invalid": hasError ? "true" : undefined,
                        "aria-describedby": hasError ? errElemId : undefined,
                      };
                    };

                    return (
                      <React.Fragment key={key}>
                        {FieldRendererComp(register, {
                          field_name: key as FormFieldNames,
                          field,
                          onChange: handleChange,
                          inputType,
                          errors: _state.errors[key],
                          errorProps: {
                            id: errElemId,
                            children: _state.errors[key]?.message,
                            role: "alert",
                            "aria-hidden": hasError ? "false" : "true",
                          },
                        })}
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
      return Object.keys(fields.shape) as ReadonlyArray<FormFieldNames>;
    },
  };

  return pukedObj;
};
