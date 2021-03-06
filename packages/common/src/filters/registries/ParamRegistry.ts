import {Deprecated, Metadata, Type} from "@tsed/core";
import {ParamMetadata} from "../class/ParamMetadata";
import {PARAM_METADATA} from "../constants";
import {IInjectableParamSettings} from "../interfaces";
import {IParamArgs} from "../interfaces/Arguments";

export class ParamRegistry {
  /**
   *
   * @param target
   * @param targetKey
   * @param index
   * @returns {any}
   */
  static get(target: Type<any>, targetKey: string | symbol, index: number): ParamMetadata {
    const params = this.getParams(target, targetKey);

    if (!params[index]) {
      params[index] = new ParamMetadata(target, targetKey, index);
      this.set(target, targetKey, index, params[index]);
    }

    return params[index];
  }

  /**
   *
   * @param target
   * @param propertyKey
   * @returns {Array}
   */
  static getParams(target: Type<any>, propertyKey: string | symbol): ParamMetadata[] {
    return Metadata.has(PARAM_METADATA, target, propertyKey) ? Metadata.get(PARAM_METADATA, target, propertyKey) : [];
  }

  /**
   *
   * @param target
   * @param propertyKey
   * @param index
   * @param paramMetadata
   */
  static set(target: Type<any>, propertyKey: string | symbol, index: number, paramMetadata: ParamMetadata): void {
    const params = this.getParams(target, propertyKey);

    params[index] = paramMetadata;

    Metadata.set(PARAM_METADATA, params, target, propertyKey);
  }

  /**
   *
   * @param service
   * @param settings
   */
  static usePreHandler(service: symbol, settings: IParamArgs<any>) {
    const param = ParamRegistry.get(settings.target, settings.propertyKey, settings.parameterIndex);
    param.service = service;
    param.useConverter = false;

    return this;
  }

  /**
   *
   * @param target
   * @param propertyKey
   * @param parameterIndex
   * @param allowedRequiredValues
   * @deprecated
   */
  // istanbul ignore next
  @Deprecated("ParamRegistry.decorate are deprecated.")
  static required(target: Type<any>, propertyKey: string | symbol, parameterIndex: number, allowedRequiredValues: any[] = []) {
    const param = ParamRegistry.get(target, propertyKey, parameterIndex);

    param.required = true;
    param.allowedRequiredValues = allowedRequiredValues;

    param.store.merge("responses", {
      "400": {
        description: "BadRequest"
      }
    });

    return this;
  }

  /**
   * Create a parameters decorators
   * @param token
   * @param {Partial<IInjectableParamSettings<any>>} options
   * @returns {Function}
   * @deprecated
   */
  // istanbul ignore next
  @Deprecated("ParamRegistry.decorate are deprecated. Use UseFilter decorator instead")
  static decorate(token: Type<any> | symbol, options: Partial<IInjectableParamSettings<any>> = {}): ParameterDecorator {
    return (target: Type<any>, propertyKey: string | symbol, parameterIndex: number): any => {
      if (typeof parameterIndex === "number") {
        const settings = Object.assign(
          {
            target,
            propertyKey,
            parameterIndex
          },
          options
        );

        if (typeof token === "symbol") {
          ParamRegistry.usePreHandler(token, settings);
        } else {
          ParamRegistry.useFilter(token, settings);
        }
      }
    };
  }

  /**
   *
   * @param service
   * @param options
   */
  static useFilter(service: Type<any>, options: IInjectableParamSettings<any>): ParamMetadata {
    const {propertyKey, parameterIndex, target, useConverter, useValidation, paramType} = options;

    let {expression, useType} = options;

    const param = ParamRegistry.get(target, propertyKey, parameterIndex);

    if (typeof expression !== "string") {
      useType = expression as any;
      expression = undefined;
    }

    param.service = service;
    param.expression = expression!;
    param.useValidation = !!useValidation;

    if (paramType) {
      param.paramType = paramType!;
    }

    if (useType) {
      param.type = useType;
    }

    if (useConverter !== undefined) {
      param.useConverter = useConverter;
    }

    return param;
  }
}
