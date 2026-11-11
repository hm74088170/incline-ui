import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdmin } from "@/components/admin/admin-provider";
import {
  adminCreateCategory,
  adminDeleteCategory,
  adminUpdateCategory,
  type CategoryInput,
  type CategoryPatch,
} from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { categoryKeys } from "./use-categories";

export function useCategoryMutations() {
  const { key, signOut } = useAdmin();
  const queryClient = useQueryClient();

  const requireKey = () => {
    if (!key) throw new ApiError("Not signed in", 401, "UNAUTHORIZED");
    return key;
  };

  const onSuccess = () => queryClient.invalidateQueries({ queryKey: categoryKeys.all });

  // key badal gayi ho to wapas login par bhejo
  const onError = (err: unknown) => {
    if (err instanceof ApiError && err.status === 401) signOut();
  };

  const create = useMutation({
    mutationFn: (input: CategoryInput) => adminCreateCategory(requireKey(), input),
    onSuccess,
    onError,
  });

  const update = useMutation({
    mutationFn: (vars: { id: string; input: CategoryPatch }) =>
      adminUpdateCategory(requireKey(), vars.id, vars.input),
    onSuccess,
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminDeleteCategory(requireKey(), id),
    onSuccess,
    onError,
  });

  return { create, update, remove };
}