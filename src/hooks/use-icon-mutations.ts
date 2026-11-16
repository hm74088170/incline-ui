import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdmin } from "@/components/admin/admin-provider";
import { deleteIcon, uploadIcon, type UploadIconInput } from "@/lib/api/admin-icons";
import { ApiError } from "@/lib/api/client";
import { iconKeys } from "./use-icons";

export function useIconMutations() {
  const { key, signOut } = useAdmin();
  const queryClient = useQueryClient();

  const requireKey = () => {
    if (!key) throw new ApiError("Not signed in", 401, "UNAUTHORIZED");
    return key;
  };

  // list, infinite aur detail teeno "icons" ke neeche hain, ek invalidate sab refresh karta hai
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: iconKeys.all });

  const onError = (err: unknown) => {
    if (err instanceof ApiError && err.status === 401) signOut();
  };

  const upload = useMutation({
    mutationFn: (input: UploadIconInput) => uploadIcon(requireKey(), input),
    onSuccess,
    onError,
  });

  const remove = useMutation({
    mutationFn: (slug: string) => deleteIcon(requireKey(), slug),
    onSuccess,
    onError,
  });

  return { upload, remove };
}