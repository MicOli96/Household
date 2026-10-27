import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { householdError, joinHousehold, saveNewMemberProfile, validateHouseholdCode } from "../data/households";
import { getMyName, validateName } from "../data/profile";

export function useJoinHouseholdForm() {
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [typedName, setTypedName] = useState<string | null>(null);
  const [nameError, setNameError] = useState("");
  const accountName = useQuery({ queryKey: ["profile"], queryFn: getMyName });
  const name = typedName ?? accountName.data ?? "";
  const [sentHouseholdId, setSentHouseholdId] = useState<string | null>(null);
  const submitting = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const join = useMutation({
    mutationFn: async (values: { code: string; name: string; householdId: string | null }) => {
      const householdId = values.householdId ?? await joinHousehold(values.code);
      try {
        await saveNewMemberProfile(householdId, values.name);
        return { householdId, profileSaved: true };
      } catch {
        return { householdId, profileSaved: false };
      }
    },
    onSuccess: ({ householdId }) => {
      queryClient.removeQueries({ queryKey: ["membership", householdId], exact: true });
      void queryClient.invalidateQueries({ queryKey: ["households"] });
    },
  });

  async function submit() {
    if (submitting.current) return;

    const codeValidation = validateHouseholdCode(code);
    const nameValidation = validateName(name);
    setError(codeValidation);
    setNameError(nameValidation);
    if (codeValidation || nameValidation) return;

    submitting.current = true;
    try {
      const { householdId, profileSaved } = await join.mutateAsync({
        code,
        name,
        householdId: sentHouseholdId,
      });
      if (!mounted.current) return;
      if (!profileSaved) {
        setSentHouseholdId(householdId);
        setNameError("Förfrågan är skickad, men ditt namn kunde inte sparas. Tryck Skicka förfrågan för att försöka igen.");
        return;
      }
      router.replace({ pathname: "/households/pending", params: { id: householdId } });
    } catch (reason) {
      if (mounted.current) setError(householdError(reason));
    } finally {
      submitting.current = false;
    }
  }

  function setName(value: string) {
    setTypedName(value);
    setNameError("");
  }

  return {
    code,
    setCode,
    codeLocked: sentHouseholdId !== null,
    error,
    name,
    setName,
    nameError,
    isSubmitting: join.isPending,
    submit,
  };
}
