import { useInfiniteQuery, useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useApiClient } from 'hooks/useApiClient';
import {
  APIOutput,
  IdUuidDTO,
  UserOutputArrayDTOAPI,
  UserOutputWithRolesDTO,
  UserSearchInputDTO,
} from '@takaro/apiclient';
import { hasNextPage, mutationWrapper } from '../util';
import { AxiosError } from 'axios';
import { useMemo } from 'react';
import { InfiniteScroll as InfiniteScrollComponent } from '@takaro/lib-components';
import { useSnackbar } from 'notistack';

export const userKeys = {
  all: ['users'] as const,
  list: () => [...userKeys.all, 'list'] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
};

interface RoleInput {
  userId: string;
  roleId: string;
}

export const useInfiniteUsers = (queryParams: UserSearchInputDTO = { page: 0 }) => {
  const apiClient = useApiClient();

  const queryOpts = useInfiniteQuery<UserOutputArrayDTOAPI, AxiosError<UserOutputArrayDTOAPI>>({
    queryKey: [...userKeys.list(), { ...queryParams }],
    queryFn: async ({ pageParam }) =>
      (
        await apiClient.user.userControllerSearch({
          ...queryParams,
          page: pageParam as number,
        })
      ).data,
    getNextPageParam: (lastPage, pages) => hasNextPage(lastPage.meta, pages.length),
    initialPageParam: queryParams.page,
  });

  const InfiniteScroll = useMemo(() => {
    return <InfiniteScrollComponent {...queryOpts} />;
  }, [queryOpts]);

  return { ...queryOpts, InfiniteScroll };
};

export const useUsers = (queryParams: UserSearchInputDTO = { page: 0 }) => {
  const apiClient = useApiClient();

  const queryOpts = useQuery<UserOutputArrayDTOAPI, AxiosError<UserOutputArrayDTOAPI>>({
    queryKey: [...userKeys.list(), { queryParams }],
    queryFn: async () => (await apiClient.user.userControllerSearch(queryParams)).data,
    placeholderData: keepPreviousData,
  });
  return queryOpts;
};

export const useUser = (userId: string) => {
  const apiClient = useApiClient();

  const queryOpts = useQuery<UserOutputWithRolesDTO, AxiosError<UserOutputWithRolesDTO>>({
    queryKey: [...userKeys.detail(userId)],
    queryFn: async () => (await apiClient.user.userControllerGetOne(userId)).data.data,
  });
  return queryOpts;
};

interface IUserRoleAssign {
  userId: string;
  roleId: string;
  expiresAt?: string;
}

export const useUserAssignRole = () => {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return mutationWrapper<APIOutput, IUserRoleAssign>(
    useMutation<APIOutput, AxiosError<APIOutput>, IUserRoleAssign>({
      mutationFn: async ({ userId, roleId, expiresAt }) => {
        const res = (await apiClient.user.userControllerAssignRole(userId, roleId, { expiresAt })).data;
        queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
        return res;
      },
    }),
    {}
  );
};

export const useUserRemoveRole = () => {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return mutationWrapper<APIOutput, RoleInput>(
    useMutation<APIOutput, AxiosError<APIOutput>, RoleInput>({
      mutationFn: async ({ userId, roleId }) => {
        const res = (await apiClient.user.userControllerRemoveRole(userId, roleId)).data;
        queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
        return res;
      },
    }),
    {}
  );
};

interface InviteUserInput {
  email: string;
}
export const useInviteUser = () => {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return mutationWrapper<APIOutput, InviteUserInput>(
    useMutation<APIOutput, AxiosError<APIOutput>, InviteUserInput>({
      mutationFn: async ({ email }) => (await apiClient.user.userControllerInvite({ email })).data,
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: userKeys.list() });
      },
    }),
    {}
  );
};

interface UserRemoveInput {
  id: string;
}
export const useUserRemove = () => {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return mutationWrapper<IdUuidDTO, UserRemoveInput>(
    useMutation<IdUuidDTO, AxiosError<IdUuidDTO>, UserRemoveInput>({
      mutationFn: async ({ id }) => (await apiClient.user.userControllerRemove(id)).data.data,
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: userKeys.list() });
        enqueueSnackbar('User has been deleted', { variant: 'default' });
      },
    }),
    {}
  );
};
