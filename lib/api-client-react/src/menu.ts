/**
 * Hand-written React Query hooks for menu-item endpoints.
 *
 * NOTE: Matches the OpenAPI spec at lib/api-spec/openapi.yaml and follows the
 * same patterns orval generates. Once `pnpm --filter @workspace/api-spec
 * generate` runs successfully (in an env with npm-registry access), regenerate
 * and remove this file.
 */
import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  MutationFunction,
  QueryFunction,
  QueryKey,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";

import { customFetch } from "./custom-fetch";
import type { ErrorType, BodyType } from "./custom-fetch";
import type { ApiError } from "./generated/api.schemas";

type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

// ---------- Types ----------

export interface MenuItem {
  id: number;
  name: string;
  description?: string | null;
  /** Price in paise (1/100 of INR). e.g. 25000 = ₹250.00 */
  pricePaise: number;
  category: string;
  imageUrl?: string | null;
  available: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMenuItemBody {
  /** @minLength 1 */
  name: string;
  description?: string;
  /** @minimum 0 */
  pricePaise: number;
  /** @minLength 1 */
  category: string;
  imageUrl?: string;
  available?: boolean;
  /** @minimum 0 */
  sortOrder?: number;
}

export interface UpdateMenuItemBody {
  name?: string;
  description?: string | null;
  pricePaise?: number;
  category?: string;
  imageUrl?: string | null;
  available?: boolean;
  sortOrder?: number;
}

export type ListMenuItemsParams = {
  availableOnly?: boolean;
  category?: string;
};

// ---------- listMenuItems ----------

export const getListMenuItemsUrl = (params?: ListMenuItemsParams) => {
  const normalized = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined) {
      normalized.append(key, value === null ? "null" : value.toString());
    }
  });
  const stringified = normalized.toString();
  return stringified.length > 0
    ? `/api/menu-items?${stringified}`
    : `/api/menu-items`;
};

export const listMenuItems = async (
  params?: ListMenuItemsParams,
  options?: RequestInit,
): Promise<MenuItem[]> => {
  return customFetch<MenuItem[]>(getListMenuItemsUrl(params), {
    ...options,
    method: "GET",
  });
};

export const getListMenuItemsQueryKey = (params?: ListMenuItemsParams) => {
  return [`/api/menu-items`, ...(params ? [params] : [])] as const;
};

export const getListMenuItemsQueryOptions = <
  TData = Awaited<ReturnType<typeof listMenuItems>>,
  TError = ErrorType<unknown>,
>(
  params?: ListMenuItemsParams,
  options?: {
    query?: UseQueryOptions<
      Awaited<ReturnType<typeof listMenuItems>>,
      TError,
      TData
    >;
    request?: SecondParameter<typeof customFetch>;
  },
) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getListMenuItemsQueryKey(params);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof listMenuItems>>> = ({
    signal,
  }) => listMenuItems(params, { signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof listMenuItems>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export function useListMenuItems<
  TData = Awaited<ReturnType<typeof listMenuItems>>,
  TError = ErrorType<unknown>,
>(
  params?: ListMenuItemsParams,
  options?: {
    query?: UseQueryOptions<
      Awaited<ReturnType<typeof listMenuItems>>,
      TError,
      TData
    >;
    request?: SecondParameter<typeof customFetch>;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getListMenuItemsQueryOptions(params, options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };
  return { ...query, queryKey: queryOptions.queryKey };
}

// ---------- createMenuItem ----------

export const getCreateMenuItemUrl = () => `/api/menu-items`;

export const createMenuItem = async (
  body: CreateMenuItemBody,
  options?: RequestInit,
): Promise<MenuItem> => {
  return customFetch<MenuItem>(getCreateMenuItemUrl(), {
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(body),
  });
};

export const useCreateMenuItem = <
  TError = ErrorType<ApiError>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof createMenuItem>>,
    TError,
    { data: BodyType<CreateMenuItemBody> },
    TContext
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseMutationResult<
  Awaited<ReturnType<typeof createMenuItem>>,
  TError,
  { data: BodyType<CreateMenuItemBody> },
  TContext
> => {
  const mutationKey = ["createMenuItem"];
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation && "mutationKey" in options.mutation && options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof createMenuItem>>,
    { data: BodyType<CreateMenuItemBody> }
  > = (props) => createMenuItem(props.data, requestOptions);

  return useMutation({ mutationFn, ...mutationOptions });
};

// ---------- getMenuItem ----------

export const getGetMenuItemUrl = (id: number) => `/api/menu-items/${id}`;

export const getMenuItem = async (
  id: number,
  options?: RequestInit,
): Promise<MenuItem> => {
  return customFetch<MenuItem>(getGetMenuItemUrl(id), {
    ...options,
    method: "GET",
  });
};

export const getGetMenuItemQueryKey = (id: number) =>
  [`/api/menu-items/${id}`] as const;

export function useGetMenuItem<
  TData = Awaited<ReturnType<typeof getMenuItem>>,
  TError = ErrorType<ApiError>,
>(
  id: number,
  options?: {
    query?: UseQueryOptions<
      Awaited<ReturnType<typeof getMenuItem>>,
      TError,
      TData
    >;
    request?: SecondParameter<typeof customFetch>;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetMenuItemQueryKey(id);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getMenuItem>>> = ({
    signal,
  }) => getMenuItem(id, { signal, ...requestOptions });
  const final = {
    queryKey,
    queryFn,
    enabled: !!id,
    ...queryOptions,
  } as UseQueryOptions<
    Awaited<ReturnType<typeof getMenuItem>>,
    TError,
    TData
  > & { queryKey: QueryKey };
  const query = useQuery(final) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };
  return { ...query, queryKey: final.queryKey };
}

// ---------- updateMenuItem ----------

export const getUpdateMenuItemUrl = (id: number) => `/api/menu-items/${id}`;

export const updateMenuItem = async (
  id: number,
  body: UpdateMenuItemBody,
  options?: RequestInit,
): Promise<MenuItem> => {
  return customFetch<MenuItem>(getUpdateMenuItemUrl(id), {
    ...options,
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(body),
  });
};

export const useUpdateMenuItem = <
  TError = ErrorType<ApiError>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof updateMenuItem>>,
    TError,
    { id: number; data: BodyType<UpdateMenuItemBody> },
    TContext
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseMutationResult<
  Awaited<ReturnType<typeof updateMenuItem>>,
  TError,
  { id: number; data: BodyType<UpdateMenuItemBody> },
  TContext
> => {
  const mutationKey = ["updateMenuItem"];
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation && "mutationKey" in options.mutation && options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof updateMenuItem>>,
    { id: number; data: BodyType<UpdateMenuItemBody> }
  > = (props) => updateMenuItem(props.id, props.data, requestOptions);

  return useMutation({ mutationFn, ...mutationOptions });
};

// ---------- deleteMenuItem ----------

export const getDeleteMenuItemUrl = (id: number) => `/api/menu-items/${id}`;

export const deleteMenuItem = async (
  id: number,
  options?: RequestInit,
): Promise<void> => {
  return customFetch<void>(getDeleteMenuItemUrl(id), {
    ...options,
    method: "DELETE",
  });
};

export const useDeleteMenuItem = <
  TError = ErrorType<ApiError>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof deleteMenuItem>>,
    TError,
    { id: number },
    TContext
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseMutationResult<
  Awaited<ReturnType<typeof deleteMenuItem>>,
  TError,
  { id: number },
  TContext
> => {
  const mutationKey = ["deleteMenuItem"];
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation && "mutationKey" in options.mutation && options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof deleteMenuItem>>,
    { id: number }
  > = (props) => deleteMenuItem(props.id, requestOptions);

  return useMutation({ mutationFn, ...mutationOptions });
};
