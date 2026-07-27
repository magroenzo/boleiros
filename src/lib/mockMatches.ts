export type MatchPosition =
  | "goalkeeper"
  | "defender"
  | "midfielder"
  | "forward"
  | "any";

export type MatchVacancies = Record<MatchPosition, number>;

export type MatchParticipant = {
  id: string;
  name: string;
  username: string;
  position: MatchPosition;
  status: "pending" | "accepted" | "rejected";
  isCurrentUser?: boolean;
};

export type MockMatch = {
  id: string;
  title: string;
  matchDate: string;
  startTime: string;
  endTime: string;
  location: string;
  city: string;
  modality: string;
  level: string;
  notes: string;
  vacancies: MatchVacancies;
  organizer: {
    id: string;
    name: string;
    username: string;
  };
  participants: MatchParticipant[];
  createdAt: string;
};

export type CreateMockMatchInput = Omit<
  MockMatch,
  "id" | "organizer" | "participants" | "createdAt"
>;

const STORAGE_KEY = "boleiros_mock_matches";
export const CURRENT_USER_ID = "current-user";

function canUseStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function getMockMatches(): MockMatch[] {
  if (!canUseStorage()) return [];

  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) return [];

    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as MockMatch[]) : [];
  } catch {
    return [];
  }
}

function saveMockMatches(matches: MockMatch[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(matches));
}

function updateMatch(
  id: string,
  updater: (match: MockMatch) => void,
): MockMatch {
  const matches = getMockMatches();
  const match = matches.find((item) => item.id === id);

  if (!match) {
    throw new Error("Partida não encontrada.");
  }

  updater(match);
  saveMockMatches(matches);
  return { ...match, participants: [...match.participants] };
}

export function createMockMatch(input: CreateMockMatchInput): MockMatch {
  const match: MockMatch = {
    ...input,
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}`,
    organizer: {
      id: CURRENT_USER_ID,
      name: "Você",
      username: "meuperfil",
    },
    participants: [
      {
        id: "request-lucas",
        name: "Lucas Ferreira",
        username: "lucasferreira",
        position: "goalkeeper",
        status: "pending",
      },
      {
        id: "request-mateus",
        name: "Mateus Silva",
        username: "mateussilva",
        position: "forward",
        status: "pending",
      },
      {
        id: "request-rafael",
        name: "Rafael Oliveira",
        username: "rafaoliveira",
        position: "defender",
        status: "pending",
      },
    ],
    createdAt: new Date().toISOString(),
  };

  saveMockMatches([match, ...getMockMatches()]);
  return match;
}

export function getMockMatchById(id: string) {
  return getMockMatches().find((match) => match.id === id) ?? null;
}

export function joinMockMatch(id: string, position: MatchPosition = "any") {
  return updateMatch(id, (match) => {
    const alreadyJoined = match.participants.some(
      (participant) => participant.isCurrentUser,
    );

    if (alreadyJoined) return;

    match.participants.push({
      id: CURRENT_USER_ID,
      name: "Você",
      username: "meuperfil",
      position,
      status: "pending",
      isCurrentUser: true,
    });
  });
}

export function leaveMockMatch(id: string) {
  return updateMatch(id, (match) => {
    match.participants = match.participants.filter(
      (participant) => !participant.isCurrentUser,
    );
  });
}

export function updateParticipantStatus(
  matchId: string,
  participantId: string,
  status: "accepted" | "rejected",
) {
  return updateMatch(matchId, (match) => {
    const participant = match.participants.find(
      (item) => item.id === participantId,
    );

    if (!participant) {
      throw new Error("Solicitação não encontrada.");
    }

    if (status === "accepted") {
      const totalForPosition = match.vacancies[participant.position];

      if (participant.position !== "any" && totalForPosition <= 0) {
        throw new Error("Não há vagas disponíveis para essa posição.");
      }

      if (participant.position !== "any") {
        match.vacancies[participant.position] = Math.max(
          0,
          match.vacancies[participant.position] - 1,
        );
      } else if (match.vacancies.any > 0) {
        match.vacancies.any -= 1;
      }

      participant.status = "accepted";
      return;
    }

    participant.status = "rejected";
  });
}

export function removeParticipant(matchId: string, participantId: string) {
  return updateMatch(matchId, (match) => {
    const participant = match.participants.find(
      (item) => item.id === participantId,
    );

    if (participant?.status === "accepted") {
      match.vacancies[participant.position] += 1;
    }

    match.participants = match.participants.filter(
      (item) => item.id !== participantId,
    );
  });
}