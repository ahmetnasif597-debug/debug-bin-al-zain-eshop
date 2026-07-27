/**
 * Manual hooks for /api/banners, written by hand in the same style as the
 * orval-generated hooks in ./generated/api.ts.
 *
 * NOTE: This file exists because banners were not yet added to the OpenAPI
 * spec that orval generates from. Once /api/banners is added to that spec
 * and `orval` is re-run, these manual hooks can be deleted and replaced by
 * the generated ones (useListBanners, useCreateBanner, etc. would then come
 * from ./generated/api instead).
 */
import {
  useMutation,
  useQuery
} from '@tanstack/react-query';
import type {
  MutationFunction,
  QueryFunction,
  QueryKey,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult
} from '@tanstack/react-query';

import { customFetch } from './custom-fetch';
import type { ErrorType, BodyType } from './custom-fetch';

type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export interface Banner {
  id: number;
  title: string;
  imageUrl: string;
  link: string;
  createdAt?: string;
}

export interface BannerInput {
  title: string;
  imageUrl: string;
  link: string;
}

// ----- List banners -----

export const getListBannersUrl = () => `/api/banners`;

export const listBanners = async (options?: RequestInit): Promise<Banner[]> => {
  return customFetch<Banner[]>(getListBannersUrl(), {
    ...options,
    method: 'GET',
  });
};

export const getListBannersQueryKey = () => {
  return [`/api/banners`] as const;
};

export const getListBannersQueryOptions = <TData = Awaited<ReturnType<typeof listBanners>>, TError = ErrorType<unknown>>(
  options?: { query?: UseQueryOptions<Awaited<ReturnType<typeof listBanners>>, TError, TData>, request?: SecondParameter<typeof customFetch> }
) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getListBannersQueryKey();

  const queryFn: QueryFunction<Awaited<ReturnType<typeof listBanners>>> = ({ signal }) =>
    listBanners({ signal, ...requestOptions });

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<Awaited<ReturnType<typeof listBanners>>, TError, TData> & { queryKey: QueryKey };
};

export function useListBanners<TData = Awaited<ReturnType<typeof listBanners>>, TError = ErrorType<unknown>>(
  options?: { query?: UseQueryOptions<Awaited<ReturnType<typeof listBanners>>, TError, TData>, request?: SecondParameter<typeof customFetch> }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getListBannersQueryOptions(options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & { queryKey: QueryKey };
  return { ...query, queryKey: queryOptions.queryKey };
}

// ----- Create banner -----

export const getCreateBannerUrl = () => `/api/banners`;

export const createBanner = async (bannerInput: BannerInput, options?: RequestInit): Promise<Banner> => {
  return customFetch<Banner>(getCreateBannerUrl(), {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(bannerInput),
  });
};

export const getCreateBannerMutationOptions = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof createBanner>>, TError, { data: BodyType<BannerInput> }, TContext>, request?: SecondParameter<typeof customFetch> }
): UseMutationOptions<Awaited<ReturnType<typeof createBanner>>, TError, { data: BodyType<BannerInput> }, TContext> => {
  const mutationKey = ['createBanner'];
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<Awaited<ReturnType<typeof createBanner>>, { data: BodyType<BannerInput> }> = (props) => {
    const { data } = props ?? {};
    return createBanner(data, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export const useCreateBanner = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof createBanner>>, TError, { data: BodyType<BannerInput> }, TContext>, request?: SecondParameter<typeof customFetch> }
): UseMutationResult<Awaited<ReturnType<typeof createBanner>>, TError, { data: BodyType<BannerInput> }, TContext> => {
  return useMutation(getCreateBannerMutationOptions(options));
};

// ----- Update banner -----

export const getUpdateBannerUrl = (id: number) => `/api/banners/${id}`;

export const updateBanner = async (id: number, bannerInput: BannerInput, options?: RequestInit): Promise<Banner> => {
  return customFetch<Banner>(getUpdateBannerUrl(id), {
    ...options,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(bannerInput),
  });
};

export const getUpdateBannerMutationOptions = <TError = ErrorType<void>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateBanner>>, TError, { id: number; data: BodyType<BannerInput> }, TContext>, request?: SecondParameter<typeof customFetch> }
): UseMutationOptions<Awaited<ReturnType<typeof updateBanner>>, TError, { id: number; data: BodyType<BannerInput> }, TContext> => {
  const mutationKey = ['updateBanner'];
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<Awaited<ReturnType<typeof updateBanner>>, { id: number; data: BodyType<BannerInput> }> = (props) => {
    const { id, data } = props ?? {};
    return updateBanner(id, data, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export const useUpdateBanner = <TError = ErrorType<void>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateBanner>>, TError, { id: number; data: BodyType<BannerInput> }, TContext>, request?: SecondParameter<typeof customFetch> }
): UseMutationResult<Awaited<ReturnType<typeof updateBanner>>, TError, { id: number; data: BodyType<BannerInput> }, TContext> => {
  return useMutation(getUpdateBannerMutationOptions(options));
};

// ----- Delete banner -----

export const getDeleteBannerUrl = (id: number) => `/api/banners/${id}`;

export const deleteBanner = async (id: number, options?: RequestInit): Promise<void> => {
  return customFetch<void>(getDeleteBannerUrl(id), {
    ...options,
    method: 'DELETE',
  });
};

export const getDeleteBannerMutationOptions = <TError = ErrorType<void>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteBanner>>, TError, { id: number }, TContext>, request?: SecondParameter<typeof customFetch> }
): UseMutationOptions<Awaited<ReturnType<typeof deleteBanner>>, TError, { id: number }, TContext> => {
  const mutationKey = ['deleteBanner'];
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteBanner>>, { id: number }> = (props) => {
    const { id } = props ?? {};
    return deleteBanner(id, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export const useDeleteBanner = <TError = ErrorType<void>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteBanner>>, TError, { id: number }, TContext>, request?: SecondParameter<typeof customFetch> }
): UseMutationResult<Awaited<ReturnType<typeof deleteBanner>>, TError, { id: number }, TContext> => {
  return useMutation(getDeleteBannerMutationOptions(options));
};
