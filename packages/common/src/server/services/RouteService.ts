import {InjectorService, Service, TokenProvider} from "@tsed/di";
import {ControllerProvider} from "../../mvc/class/ControllerProvider";
import {EndpointMetadata} from "../../mvc/class/EndpointMetadata";
import {IControllerRoute} from "../../mvc/interfaces";
import {ExpressApplication} from "../decorators/expressApplication";

export interface IRouteProvider {
  route: string;
  provider: ControllerProvider;
}

/**
 * `RouteService` is used to provide all routes collected by annotation `@Controller`.
 */
@Service()
export class RouteService {
  private readonly _routes: IRouteProvider[] = [];

  constructor(private injector: InjectorService, @ExpressApplication private expressApplication: ExpressApplication) {
  }

  get routes(): IRouteProvider[] {
    return this._routes || [];
  }

  /**
   * Add a new route in the route registry
   * @param endpoint
   * @param token
   */
  public addRoute(endpoint: string, token: TokenProvider) {
    if (this.injector.hasProvider(token)) {
      const provider: ControllerProvider = this.injector.getProvider(token)! as any;
      const route = provider.getEndpointUrl(endpoint);

      if (!provider.hasParent()) {
        this._routes.push({
          route,
          provider
        });
        this.expressApplication.use(route, provider.router);
      }
    }

    return this;
  }

  /**
   * Get all routes built by TsExpressDecorators and mounted on Express application.
   * @returns {IControllerRoute[]}
   */
  public getRoutes(): IControllerRoute[] {
    let routes: IControllerRoute[] = [];

    this.routes.forEach((config: {route: string; provider: ControllerProvider}) => {
      routes = routes.concat(this.buildRoutes(config.route, config.provider));
    });

    return routes;
  }

  /**
   * @deprecated Use getRoutes instead of
   */
  public getAll() {
    return this.getRoutes();
  }

  /**
   *
   * @param ctrl
   * @param endpointUrl
   */
  private buildRoutes(endpointUrl: string, ctrl: ControllerProvider): IControllerRoute[] {
    let routes: IControllerRoute[] = [];

    ctrl
      .children
      .map(ctrl => this.injector.getProvider(ctrl))
      .forEach((provider: ControllerProvider) => {
        routes = routes.concat(this.buildRoutes(`${endpointUrl}${provider.path}`, provider));
      });

    ctrl.endpoints.forEach((endpoint: EndpointMetadata) => {
      const {pathsMethods, params, targetName, methodClassName} = endpoint;

      pathsMethods.forEach(({path, method}) => {
        if (!!method) {
          routes.push({
            method,
            name: `${targetName}.${String(methodClassName)}()`,
            url: `${endpointUrl}${path || ""}`.replace(/\/\//gi, "/"),
            className: targetName,
            methodClassName,
            parameters: params
          });
        }
      });
    });

    return routes;
  }
}
