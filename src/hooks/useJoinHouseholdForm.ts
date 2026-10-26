import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { householdError, joinHousehold, validateHouseholdCode } from "../data/households";

export function useJoinHouseholdForm() {
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const submitting = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const join = useMutation({
    mutationFn: joinHousehold,
    onSuccess: (householdId) => {
      queryClient.removeQueries({ queryKey: ["membership", householdId], exact: true });
      void queryClient.invalidateQueries({ queryKey: ["households"] });
    },
  });

  async function submit() {
    if (submitting.current) return;

    const validation = validateHouseholdCode(code);
    setError(validation);
    if (validation) return;

    submitting.current = true;
    try {
      const householdId = await join.mutateAsync(code);
      if (!mounted.current) return;
      router.replace({ pathname: "/households/pending", params: { id: householdId } });
    } catch (reason) {
      if (mounted.current) setError(householdError(reason));
    } finally {
      submitting.current = false;
    }
  }

  return { code, setCode, error, isSubmitting: join.isPending, submit };
}
