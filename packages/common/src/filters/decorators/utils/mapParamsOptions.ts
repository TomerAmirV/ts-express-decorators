import {IParamOptions} from "@tsed/common";
import {isObject, isPrimitive} from "@tsed/core";

export function mapParamsOptions(args: any[]): IParamOptions<any> {
  if (args.length === 1) {
    if (isPrimitive(args[0])) {
      return {
        expression: args[0]
      };
    }

    if (!isObject(args[0])) {
      return {
        useType: args[0]
      };
    }

    return args[0];
  }

  return {
    expression: args[0],
    useType: args[1]
  };
}
