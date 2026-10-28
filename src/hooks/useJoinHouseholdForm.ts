import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { joinHousehold, saveNewMemberProfile, validateHouseholdCode } from "../data/households";
import { getMyName, validateName } from "../data/profile";
import { errorMessage } from "../lib/errors";

export function useJoinHouseholdForm() {
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [typedName, setTypedName] = useState<string | null>(null);
  const [nameError, setNameError] = useState("");
  const accountName = useQuery({ queryKey: ["profile"], queryFn: getMyName });
  const name = typedName ?? accountName.data ?? "";
  const [sentHouseholdId, setSentHouseholdId] = useState<string | null>(null);

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

  function submit() {
    if (join.isPending) return;

    const codeValidation = validateHouseholdCode(code);
    const nameValidation = validateName(name);
    setError(codeValidation);
    setNameError(nameValidation);
    if (codeValidation || nameValidation) return;

    // Svaren nedan körs inte om skärmen har stängts under tiden.
    join.mutate({ code, name, householdId: sentHouseholdId }, {
      onSuccess: ({ householdId, profileSaved }) => {
        if (!profileSaved) {
          setSentHouseholdId(householdId);
          setNameError("Förfrågan är skickad, men ditt namn kunde inte sparas. Tryck Skicka förfrågan för att försöka igen.");
          return;
        }
        router.replace({ pathname: "/households/pending", params: { id: householdId } });
      },
      onError: (reason) => setError(errorMessage(reason)),
    });
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
