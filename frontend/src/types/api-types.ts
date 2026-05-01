/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface TaskRequestDTO {
  title?: string;
  description?: string;
  /** @format date-time */
  deadline?: string;
  /** @uniqueItems true */
  categoryIds?: number[];
  tagsInput?: string;
}

export interface CategoryDTO {
  /** @format int64 */
  id?: number;
  title?: string;
}

export interface TagDTO {
  /** @minLength 1 */
  name: string;
}

export interface TaskResponseDTO {
  /** @format int64 */
  id?: number;
  title?: string;
  description?: string;
  completed?: boolean;
  /** @format date-time */
  createdAt?: string;
  /** @format date-time */
  deadline?: string;
  /** @format date-time */
  lastEdit?: string;
  /** @uniqueItems true */
  categories?: CategoryDTO[];
  /** @uniqueItems true */
  tags?: TagDTO[];
}

export interface Tag {
  /** @format int64 */
  id?: number;
  name?: string;
}

export interface UsuarioRegistroDTO {
  /**
   * @minLength 3
   * @maxLength 50
   */
  username: string;
  /** @minLength 1 */
  fullName: string;
  /**
   * @format email
   * @minLength 1
   */
  email: string;
  /**
   * @minLength 1
   * @pattern ^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!.])(?=\S+$).{8,}$
   */
  password: string;
  confirmPassword?: string;
}

export interface Category {
  /** @format int64 */
  id?: number;
  title?: string;
}

export interface UsuarioDTO {
  username?: string;
  role?: string;
  fullName?: string;
}

export interface Task {
  /** @format int64 */
  id?: number;
  /** @format date-time */
  createdAt?: string;
  /** @format date-time */
  deadline?: string;
  /** @format date-time */
  lastEdit?: string;
  title?: string;
  description?: string;
  completed?: boolean;
  /** @uniqueItems true */
  categories?: Category[];
  /** @uniqueItems true */
  tags?: Tag[];
}

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown>
  extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "http://127.0.0.1:8080";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) =>
    fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter(
      (key) => "undefined" !== typeof query[key],
    );
    return keys
      .map((key) =>
        Array.isArray(query[key])
          ? this.addArrayQueryParam(query, key)
          : this.addQueryParam(query, key),
      )
      .join("&");
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.JsonApi]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.Text]: (input: any) =>
      input !== null && typeof input !== "string"
        ? JSON.stringify(input)
        : input,
    [ContentType.FormData]: (input: any) => {
      if (input instanceof FormData) {
        return input;
      }

      return Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`,
        );
        return formData;
      }, new FormData());
    },
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(
    params1: RequestParams,
    params2?: RequestParams,
  ): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (
    cancelToken: CancelToken,
  ): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(
      `${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`,
      {
        ...requestParams,
        headers: {
          ...(requestParams.headers || {}),
          ...(type && type !== ContentType.FormData
            ? { "Content-Type": type }
            : {}),
        },
        signal:
          (cancelToken
            ? this.createAbortSignal(cancelToken)
            : requestParams.signal) || null,
        body:
          typeof body === "undefined" || body === null
            ? null
            : payloadFormatter(body),
      },
    ).then(async (response) => {
      const r = response as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const responseToParse = responseFormat ? response.clone() : response;
      const data = !responseFormat
        ? r
        : await responseToParse[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data;
    });
  };
}

/**
 * @title OpenAPI definition
 * @version v0
 * @baseUrl http://127.0.0.1:8080
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  api = {
    /**
     * No description
     *
     * @tags task-controller
     * @name EditTask
     * @request PUT:/api/tasks/{id}
     */
    editTask: (id: number, data: TaskRequestDTO, params: RequestParams = {}) =>
      this.request<TaskResponseDTO, any>({
        path: `/api/tasks/${id}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags task-controller
     * @name DeleteTask
     * @request DELETE:/api/tasks/{id}
     */
    deleteTask: (id: number, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/tasks/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags tag-controller
     * @name Update
     * @request PUT:/api/tag/{id}
     */
    update: (id: number, data: TagDTO, params: RequestParams = {}) =>
      this.request<Tag, any>({
        path: `/api/tag/${id}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags task-controller
     * @name GetMyTasks
     * @request GET:/api/tasks
     */
    getMyTasks: (params: RequestParams = {}) =>
      this.request<TaskResponseDTO[], any>({
        path: `/api/tasks`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags task-controller
     * @name CreateTask
     * @request POST:/api/tasks
     */
    createTask: (data: TaskRequestDTO, params: RequestParams = {}) =>
      this.request<TaskResponseDTO, any>({
        path: `/api/tasks`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags tag-controller
     * @name ListAll
     * @request GET:/api/tag
     */
    listAll: (params: RequestParams = {}) =>
      this.request<Tag[], any>({
        path: `/api/tag`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags tag-controller
     * @name Create
     * @request POST:/api/tag
     */
    create: (data: TagDTO, params: RequestParams = {}) =>
      this.request<Tag, any>({
        path: `/api/tag`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags auth-controller
     * @name ProcesarRegistro
     * @request POST:/api/auth/register
     */
    procesarRegistro: (
      query: {
        registroDTO: UsuarioRegistroDTO;
      },
      params: RequestParams = {},
    ) =>
      this.request<string, any>({
        path: `/api/auth/register`,
        method: "POST",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags auth-controller
     * @name ProcesarRecuperacion
     * @request POST:/api/auth/forgot-password
     */
    procesarRecuperacion: (
      query: {
        email: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<string, any>({
        path: `/api/auth/forgot-password`,
        method: "POST",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags admin-controller
     * @name CreateCat
     * @request POST:/api/admin/categories
     */
    createCat: (data: Category, params: RequestParams = {}) =>
      this.request<Category, any>({
        path: `/api/admin/categories`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags task-controller
     * @name ToggleTask
     * @request PATCH:/api/tasks/{id}/toggle
     */
    toggleTask: (id: number, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/tasks/${id}/toggle`,
        method: "PATCH",
        ...params,
      }),

    /**
     * No description
     *
     * @tags admin-controller
     * @name MakeAdmin
     * @request PATCH:/api/admin/users/{id}/promote
     */
    makeAdmin: (id: number, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/admin/users/${id}/promote`,
        method: "PATCH",
        ...params,
      }),

    /**
     * No description
     *
     * @tags usuario-controller
     * @name GetCurrentUser
     * @request GET:/api/user/me
     */
    getCurrentUser: (params: RequestParams = {}) =>
      this.request<UsuarioDTO, any>({
        path: `/api/user/me`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags tag-controller
     * @name GetByName
     * @request GET:/api/tag/name/{name}
     */
    getByName: (name: string, params: RequestParams = {}) =>
      this.request<Tag, any>({
        path: `/api/tag/name/${name}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags tag-controller
     * @name DeleteByName
     * @request DELETE:/api/tag/name/{name}
     */
    deleteByName: (name: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/tag/name/${name}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags data-controller
     * @name GetInitialData
     * @request GET:/api/init
     */
    getInitialData: (params: RequestParams = {}) =>
      this.request<object, any>({
        path: `/api/init`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags cat-controller
     * @name ListAll1
     * @request GET:/api/cats
     */
    listAll1: (params: RequestParams = {}) =>
      this.request<Category[], any>({
        path: `/api/cats`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags cat-controller
     * @name GetById
     * @request GET:/api/cats/{id}
     */
    getById: (
      id: string,
      query: {
        /** @format int64 */
        id: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<Category, any>({
        path: `/api/cats/${id}`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags auth-controller
     * @name CheckUsername
     * @request GET:/api/auth/check-username
     */
    checkUsername: (
      query: {
        username: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<boolean, any>({
        path: `/api/auth/check-username`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags auth-controller
     * @name CheckEmail
     * @request GET:/api/auth/check-email
     */
    checkEmail: (
      query: {
        email: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<boolean, any>({
        path: `/api/auth/check-email`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags admin-controller
     * @name ListAll2
     * @request GET:/api/admin/users
     */
    listAll2: (params: RequestParams = {}) =>
      this.request<UsuarioDTO[], any>({
        path: `/api/admin/users`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags admin-controller
     * @name GetAllTasks
     * @request GET:/api/admin/tasks
     */
    getAllTasks: (params: RequestParams = {}) =>
      this.request<Task[], any>({
        path: `/api/admin/tasks`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags tag-controller
     * @name Delete
     * @request DELETE:/api/tag/id/{id}
     */
    delete: (id: number, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/tag/id/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags admin-controller
     * @name DeleteTask1
     * @request DELETE:/api/admin/tasks/{id}
     */
    deleteTask1: (id: number, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/admin/tasks/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags admin-controller
     * @name BorrarCategoria
     * @request DELETE:/api/admin/categories/{id}
     */
    borrarCategoria: (id: number, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/admin/categories/${id}`,
        method: "DELETE",
        ...params,
      }),
  };
}
