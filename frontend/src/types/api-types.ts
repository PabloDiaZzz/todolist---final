




export interface TaskRequestDTO {
  title?: string;
  description?: string;
  
  deadline?: string;
  
  categoryIds?: number[];
  tagsInput?: string;
  important?: boolean;
}

export interface CategoryDTO {
  
  id?: number;
  title?: string;
}

export interface TagDTO {
  
  name: string;
}

export interface TaskResponseDTO {
  
  id?: number;
  title?: string;
  description?: string;
  completed?: boolean;
  
  createdAt?: string;
  
  deadline?: string;
  
  lastEdit?: string;
  
  categories?: CategoryDTO[];
  
  tags?: TagDTO[];
  important?: boolean;
}

export interface Tag {
  
  id?: number;
  name?: string;
}

export interface UsuarioRegistroDTO {
  
  username: string;
  
  fullName: string;
  
  email: string;
  
  password: string;
  confirmPassword?: string;
}

export interface Category {
  
  id?: number;
  title?: string;
}

export interface UpdateProfileDTO {
  username?: string;
  fullName?: string;
  email?: string;
  theme?: string;
}

export interface UsuarioDTO {
  username?: string;
  role?: string;
  fullName?: string;
  email?: string;
  theme?: string;
}

export interface UpdatePasswordRequest {
  currentPassword?: string;
  newPassword?: string;
}

export interface UserTasksDTO {
  user?: UsuarioDTO;
  tasks?: TaskResponseDTO[];
}

export interface TaskUserDTO {
  task?: TaskResponseDTO;
  author?: UsuarioDTO;
}

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  
  secure?: boolean;
  
  path: string;
  
  type?: ContentType;
  
  query?: QueryParamsType;
  
  format?: ResponseFormat;
  
  body?: unknown;
  
  baseUrl?: string;
  
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

export const ContentType = {
  Json: "application/json",
  JsonApi: "application/vnd.api+json",
  FormData: "multipart/form-data",
  UrlEncoded: "application/x-www-form-urlencoded",
  Text: "text/plain",
} as const;
export type ContentType = typeof ContentType[keyof typeof ContentType];

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


export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  api = {
    
    editTask: (id: number, data: TaskRequestDTO, params: RequestParams = {}) =>
      this.request<TaskResponseDTO, any>({
        path: `/api/tasks/${id}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    
    deleteTask: (id: number, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/tasks/${id}`,
        method: "DELETE",
        ...params,
      }),

    
    update: (id: number, data: TagDTO, params: RequestParams = {}) =>
      this.request<Tag, any>({
        path: `/api/tag/${id}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    
    getMyTasks: (params: RequestParams = {}) =>
      this.request<TaskResponseDTO[], any>({
        path: `/api/tasks`,
        method: "GET",
        ...params,
      }),

    
    createTask: (data: TaskRequestDTO, params: RequestParams = {}) =>
      this.request<TaskResponseDTO, any>({
        path: `/api/tasks`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    
    listAll: (params: RequestParams = {}) =>
      this.request<Tag[], any>({
        path: `/api/tag`,
        method: "GET",
        ...params,
      }),

    
    create: (data: TagDTO, params: RequestParams = {}) =>
      this.request<Tag, any>({
        path: `/api/tag`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    
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

    
    createCat: (data: Category, params: RequestParams = {}) =>
      this.request<Category, any>({
        path: `/api/admin/categories`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    
    updateProfile: (data: UpdateProfileDTO, params: RequestParams = {}) =>
      this.request<UsuarioDTO, any>({
        path: `/api/user/profile`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    
    updatePassword: (data: UpdatePasswordRequest, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/user/password`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    
    toggleTask: (id: number, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/tasks/${id}/toggle`,
        method: "PATCH",
        ...params,
      }),

    
    toggleImportant: (id: number, params: RequestParams = {}) =>
      this.request<TaskResponseDTO, any>({
        path: `/api/tasks/${id}/important`,
        method: "PATCH",
        ...params,
      }),

    
    updateUserProfile: (
      username: string,
      data: UpdateProfileDTO,
      params: RequestParams = {},
    ) =>
      this.request<UsuarioDTO, any>({
        path: `/api/admin/users/${username}`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    
    makeAdmin: (
      username: string,
      query?: {
        role?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/admin/users/${username}/promote`,
        method: "PATCH",
        query: query,
        ...params,
      }),

    
    getCurrentUser: (params: RequestParams = {}) =>
      this.request<UsuarioDTO, any>({
        path: `/api/user/me`,
        method: "GET",
        ...params,
      }),

    
    deleteAccount: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/user/me`,
        method: "DELETE",
        ...params,
      }),

    
    getByName: (name: string, params: RequestParams = {}) =>
      this.request<Tag, any>({
        path: `/api/tag/name/${name}`,
        method: "GET",
        ...params,
      }),

    
    deleteByName: (name: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/tag/name/${name}`,
        method: "DELETE",
        ...params,
      }),

    
    getInitialData: (params: RequestParams = {}) =>
      this.request<object, any>({
        path: `/api/init`,
        method: "GET",
        ...params,
      }),

    
    listAll1: (params: RequestParams = {}) =>
      this.request<Category[], any>({
        path: `/api/cats`,
        method: "GET",
        ...params,
      }),

    
    getById: (
      id: string,
      query: {
        
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

    
    listAll2: (params: RequestParams = {}) =>
      this.request<UsuarioDTO[], any>({
        path: `/api/admin/users`,
        method: "GET",
        ...params,
      }),

    
    getFullUserProfile: (username: string, params: RequestParams = {}) =>
      this.request<UserTasksDTO, any>({
        path: `/api/admin/users/${username}/full-profile`,
        method: "GET",
        ...params,
      }),

    
    getAllTasks: (params: RequestParams = {}) =>
      this.request<TaskUserDTO[], any>({
        path: `/api/admin/tasks`,
        method: "GET",
        ...params,
      }),

    
    countTasksByCategory: (id: number, params: RequestParams = {}) =>
      this.request<number, any>({
        path: `/api/admin/categories/${id}/tasks/count`,
        method: "GET",
        ...params,
      }),

    
    deleteCompletedTasks: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/tasks/completed`,
        method: "DELETE",
        ...params,
      }),

    
    delete: (id: number, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/tag/id/${id}`,
        method: "DELETE",
        ...params,
      }),

    
    deleteTask1: (id: number, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/admin/tasks/${id}`,
        method: "DELETE",
        ...params,
      }),

    
    borrarCategoria: (id: number, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/admin/categories/${id}`,
        method: "DELETE",
        ...params,
      }),
  };
}
