import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  AlertCircle,
  Loader2,
  LogOut,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { PostCard } from "@/components/PostCard";
import { ProfileHeader } from "@/components/ProfileHeader";
import { ShareablePlayerCard } from "@/components/player-card/ShareablePlayerCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  aggregateStats,
  fetchMatches,
  fetchPostsByAuthor,
  fetchProfileById,
  type Profile,
} from "@/lib/db";
import { uploadMedia } from "@/lib/media";

export const Route = createFileRoute(
  "/_authenticated/perfil",
)({
  head: () => ({
    meta: [
      {
        title: "Meu perfil — Boleiros",
      },
      {
        name: "description",
        content:
          "Seus dados, estatísticas e publicações no Boleiros.",
      },
      {
        property: "og:title",
        content: "Meu perfil — Boleiros",
      },
      {
        property: "og:description",
        content:
          "Seus dados, estatísticas e publicações.",
      },
    ],
  }),
  component: PerfilPage,
});

const fieldClass =
  "h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60";

const PLAYER_POSITIONS = [
  "Goleiro",
  "Zagueiro",
  "Lateral",
  "Volante",
  "Meia",
  "Ponta",
  "Atacante",
] as const;

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

const ALLOWED_AVATAR_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
];

function PerfilPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const userId = user?.id;

  const profileQuery = useQuery({
    queryKey: ["profile", userId],
    enabled: Boolean(userId),
    queryFn: () => fetchProfileById(userId!),
  });

  const matchesQuery = useQuery({
    queryKey: ["matches", userId],
    enabled: Boolean(userId),
    queryFn: () => fetchMatches(userId!),
  });

  const postsQuery = useQuery({
    queryKey: ["posts", "author", userId],
    enabled: Boolean(userId),
    queryFn: () => fetchPostsByAuthor(userId!),
  });

  async function signOut() {
    if (signingOut) {
      return;
    }

    try {
      setSigningOut(true);

      await queryClient.cancelQueries();

      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      queryClient.clear();

      await navigate({
        to: "/auth",
        replace: true,
      });
    } catch (error) {
      console.error("Erro ao sair:", error);

      toast.error(
        "Não foi possível sair da conta. Tente novamente.",
      );
    } finally {
      setSigningOut(false);
    }
  }

  if (!userId) {
    return (
      <AppShell title="Perfil">
        <StatusMessage
          title="Sessão não encontrada"
          description="Entre novamente para acessar seu perfil."
          action={
            <Button
              type="button"
              variant="soft"
              onClick={() => {
                void navigate({
                  to: "/auth",
                  replace: true,
                });
              }}
            >
              Ir para o login
            </Button>
          }
        />
      </AppShell>
    );
  }

  if (profileQuery.isPending) {
    return (
      <AppShell title="Perfil">
        <LoadingMessage text="Carregando perfil..." />
      </AppShell>
    );
  }

  if (
    profileQuery.isError ||
    !profileQuery.data
  ) {
    return (
      <AppShell title="Perfil">
        <StatusMessage
          title="Não foi possível carregar o perfil"
          description="Verifique sua conexão e tente novamente."
          action={
            <Button
              type="button"
              variant="soft"
              onClick={() => {
                void profileQuery.refetch();
              }}
            >
              Tentar novamente
            </Button>
          }
        />
      </AppShell>
    );
  }

  const profile = profileQuery.data;
  const playerMatches = matchesQuery.data ?? [];
  const cardStats = aggregateStats(playerMatches);
  const location = splitLocation(profile.city);

  return (
    <AppShell
      title="Meu perfil"
      action={
        <div className="flex gap-2">
          {!editing && (
            <Button
              type="button"
              size="icon"
              variant="soft"
              onClick={() => setEditing(true)}
              aria-label="Editar perfil"
              title="Editar perfil"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}

          <Button
            type="button"
            size="icon"
            variant="ghost"
            disabled={signingOut}
            onClick={() => void signOut()}
            aria-label="Sair"
            title="Sair"
          >
            {signingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
          </Button>
        </div>
      }
    >
      {editing ? (
        <EditProfile
          profile={profile}
          onCancel={() => setEditing(false)}
          onSaved={async () => {
            setEditing(false);

            await queryClient.invalidateQueries({
              queryKey: ["profile", userId],
            });
          }}
        />
      ) : (
        <>
          <ProfileHeader
            profile={profile}
            matches={playerMatches}
          />

          {matchesQuery.isPending ? (
            <div className="mx-4 my-6 rounded-3xl border border-border bg-card p-8">
              <LoadingMessage
                text="Carregando estatísticas..."
                compact
              />
            </div>
          ) : matchesQuery.isError ? (
            <div className="mx-4 my-6 rounded-3xl border border-destructive/30 bg-destructive/5 p-5 text-center">
              <AlertCircle className="mx-auto h-6 w-6 text-destructive" />

              <p className="mt-2 font-bold">
                Não foi possível carregar as estatísticas
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                A carta pode não mostrar os números mais
                recentes.
              </p>

              <Button
                type="button"
                variant="soft"
                className="mt-4"
                onClick={() => {
                  void matchesQuery.refetch();
                }}
              >
                Tentar novamente
              </Button>
            </div>
          ) : (
            <ShareablePlayerCard
              fullName={
                profile.full_name?.trim() ||
                profile.username ||
                "Jogador"
              }
              username={profile.username}
              avatarUrl={profile.avatar_url}
              position={profile.position}
              city={location.city}
              state={location.state}
              overall={cardStats.overall}
              matches={cardStats.jogos}
              goals={cardStats.gols}
              assists={cardStats.assistencias}
              mvps={cardStats.mvps}
            />
          )}

          <div className="mt-6 border-t border-border">
            {postsQuery.isPending && (
              <LoadingMessage
                text="Carregando publicações..."
                compact
              />
            )}

            {postsQuery.isError && (
              <div className="px-4 py-10 text-center">
                <AlertCircle className="mx-auto h-6 w-6 text-destructive" />

                <p className="mt-2 text-sm font-semibold">
                  Não foi possível carregar suas
                  publicações.
                </p>

                <Button
                  type="button"
                  variant="soft"
                  className="mt-4"
                  onClick={() => {
                    void postsQuery.refetch();
                  }}
                >
                  Tentar novamente
                </Button>
              </div>
            )}

            {!postsQuery.isPending &&
              !postsQuery.isError &&
              postsQuery.data?.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={userId}
                />
              ))}

            {!postsQuery.isPending &&
              !postsQuery.isError &&
              postsQuery.data?.length === 0 && (
                <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Você ainda não publicou nada.
                </p>
              )}
          </div>
        </>
      )}
    </AppShell>
  );
}

function EditProfile({
  profile,
  onCancel,
  onSaved,
}: {
  profile: Profile;
  onCancel: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [form, setForm] =
    useState<Profile>(profile);

  const [avatar, setAvatar] =
    useState<File | null>(null);

  const [avatarPreview, setAvatarPreview] =
    useState<string | null>(null);

  useEffect(() => {
    setForm(profile);
    setAvatar(null);
  }, [profile]);

  useEffect(() => {
    if (!avatar) {
      setAvatarPreview(null);
      return;
    }

    const previewUrl =
      URL.createObjectURL(avatar);

    setAvatarPreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [avatar]);

  function updateField<K extends keyof Profile>(
    field: K,
    value: Profile[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function optionalNumber(
    value: string,
  ): number | null {
    if (value.trim() === "") {
      return null;
    }

    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : null;
  }

  function selectAvatar(
    selectedFile: File | undefined,
  ) {
    if (!selectedFile) {
      setAvatar(null);
      return;
    }

    if (
      !ALLOWED_AVATAR_TYPES.includes(
        selectedFile.type,
      )
    ) {
      toast.error(
        "Selecione uma imagem PNG, JPG ou WebP.",
      );
      return;
    }

    if (selectedFile.size > MAX_AVATAR_SIZE) {
      toast.error(
        "A imagem pode ter no máximo 5 MB.",
      );
      return;
    }

    setAvatar(selectedFile);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const username = normalizeUsername(
        form.username,
      );

      const fullName =
        form.full_name?.trim() ?? "";

      const bio =
        form.bio?.trim() || null;

      const city =
        form.city?.trim() || null;

      const birthDate =
        form.birth_date || null;

      validateProfile({
        username,
        fullName,
        bio,
        birthDate,
        heightCm: form.height_cm,
        weightKg: form.weight_kg,
        titles: form.titles,
        avatar,
      });

      const {
        data: existingUsername,
        error: usernameError,
      } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .neq("id", profile.id)
        .maybeSingle();

      if (usernameError) {
        throw usernameError;
      }

      if (existingUsername) {
        throw new Error(
          "Esse nome de usuário já está sendo utilizado.",
        );
      }

      let avatarPath = form.avatar_url;

      if (avatar) {
        avatarPath = await uploadMedia(
          profile.id,
          avatar,
        );
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          username,
          full_name: fullName,
          city,
          birth_date: birthDate,
          height_cm:
            form.height_cm ?? null,
          weight_kg:
            form.weight_kg ?? null,
          dominant_foot:
            form.dominant_foot || null,
          position:
            form.position || null,
          bio,
          titles: Math.max(
            0,
            Math.trunc(form.titles ?? 0),
          ),
          avatar_url: avatarPath,
        })
        .eq("id", profile.id);

      if (error) {
        throw error;
      }

      return {
        username,
        fullName,
        avatarPath,
      };
    },

    onSuccess: async () => {
      toast.success(
        "Perfil atualizado com sucesso",
      );

      await onSaved();
    },

    onError: (error: unknown) => {
      console.error(
        "Erro ao atualizar perfil:",
        error,
      );

      toast.error(
        getErrorMessage(
          error,
          "Não foi possível atualizar o perfil.",
        ),
      );
    },
  });

  const displayedAvatar =
    avatarPreview || form.avatar_url;

  const formChanged =
    hasProfileChanged(profile, form) ||
    avatar !== null;

  return (
    <form
      className="space-y-5 p-4"
      onSubmit={(event) => {
        event.preventDefault();

        if (!formChanged) {
          toast.info(
            "Nenhuma alteração foi realizada.",
          );
          return;
        }

        saveMutation.mutate();
      }}
    >
      <section className="rounded-3xl border border-border bg-card p-4">
        <h2 className="font-bold">
          Foto do perfil
        </h2>

        <div className="mt-4 flex items-center gap-4">
          <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-muted">
            {displayedAvatar ? (
              <img
                src={displayedAvatar}
                alt="Foto de perfil"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xl font-extrabold text-muted-foreground">
                {getProfileInitial(form)}
              </span>
            )}
          </div>

          <label className="flex-1 cursor-pointer rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-center text-sm font-semibold text-primary transition-colors hover:bg-primary/10">
            {avatar
              ? "Escolher outra imagem"
              : "Selecionar imagem"}

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              disabled={saveMutation.isPending}
              onChange={(event) => {
                selectAvatar(
                  event.target.files?.[0],
                );

                event.target.value = "";
              }}
            />
          </label>
        </div>

        {avatar && (
          <button
            type="button"
            className="mt-3 text-xs font-semibold text-destructive transition-opacity hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={saveMutation.isPending}
            onClick={() => setAvatar(null)}
          >
            Cancelar troca da imagem
          </button>
        )}

        <p className="mt-3 text-xs text-muted-foreground">
          PNG, JPG ou WebP de até 5 MB.
        </p>
      </section>

      <section className="space-y-4 rounded-3xl border border-border bg-card p-4">
        <h2 className="font-bold">
          Informações pessoais
        </h2>

        <Field label="Nome completo">
          <input
            className={fieldClass}
            placeholder="Seu nome completo"
            required
            maxLength={80}
            autoComplete="name"
            disabled={saveMutation.isPending}
            value={form.full_name ?? ""}
            onChange={(event) =>
              updateField(
                "full_name",
                event.target.value,
              )
            }
          />
        </Field>

        <Field
          label="Nome de usuário"
          helpText="Use letras minúsculas, números, ponto ou underline."
        >
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              @
            </span>

            <input
              className={`${fieldClass} pl-8`}
              placeholder="enzomagro"
              required
              minLength={3}
              maxLength={30}
              autoCapitalize="none"
              autoComplete="username"
              spellCheck={false}
              disabled={saveMutation.isPending}
              value={form.username}
              onChange={(event) =>
                updateField(
                  "username",
                  normalizeUsernameInput(
                    event.target.value,
                  ),
                )
              }
            />
          </div>
        </Field>

        <Field label="Cidade">
          <input
            className={fieldClass}
            placeholder="Ex.: Carlos Barbosa - RS"
            maxLength={80}
            autoComplete="address-level2"
            disabled={saveMutation.isPending}
            value={form.city ?? ""}
            onChange={(event) =>
              updateField(
                "city",
                event.target.value,
              )
            }
          />
        </Field>

        <Field label="Data de nascimento">
          <input
            type="date"
            className={fieldClass}
            max={getTodayDate()}
            disabled={saveMutation.isPending}
            value={form.birth_date ?? ""}
            onChange={(event) =>
              updateField(
                "birth_date",
                event.target.value,
              )
            }
          />
        </Field>
      </section>

      <section className="space-y-4 rounded-3xl border border-border bg-card p-4">
        <h2 className="font-bold">
          Informações do jogador
        </h2>

        <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
          <Field label="Posição">
            <select
              className={fieldClass}
              disabled={saveMutation.isPending}
              value={form.position ?? ""}
              onChange={(event) =>
                updateField(
                  "position",
                  event.target.value,
                )
              }
            >
              <option value="">
                Selecionar
              </option>

              {PLAYER_POSITIONS.map(
                (position) => (
                  <option
                    key={position}
                    value={position}
                  >
                    {position}
                  </option>
                ),
              )}
            </select>
          </Field>

          <Field label="Pé dominante">
            <select
              className={fieldClass}
              disabled={saveMutation.isPending}
              value={
                form.dominant_foot ?? ""
              }
              onChange={(event) =>
                updateField(
                  "dominant_foot",
                  event.target.value,
                )
              }
            >
              <option value="">
                Selecionar
              </option>

              <option value="direito">
                Direito
              </option>

              <option value="esquerdo">
                Esquerdo
              </option>

              <option value="ambidestro">
                Ambidestro
              </option>
            </select>
          </Field>

          <Field label="Altura">
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                className={`${fieldClass} pr-12`}
                placeholder="170"
                min={100}
                max={250}
                step={1}
                disabled={
                  saveMutation.isPending
                }
                value={
                  form.height_cm ?? ""
                }
                onChange={(event) =>
                  updateField(
                    "height_cm",
                    optionalNumber(
                      event.target.value,
                    ),
                  )
                }
              />

              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                cm
              </span>
            </div>
          </Field>

          <Field label="Peso">
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                className={`${fieldClass} pr-12`}
                placeholder="70"
                min={30}
                max={300}
                step="0.1"
                disabled={
                  saveMutation.isPending
                }
                value={
                  form.weight_kg ?? ""
                }
                onChange={(event) =>
                  updateField(
                    "weight_kg",
                    optionalNumber(
                      event.target.value,
                    ),
                  )
                }
              />

              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                kg
              </span>
            </div>
          </Field>

          <Field label="Títulos">
            <input
              type="number"
              inputMode="numeric"
              className={fieldClass}
              placeholder="0"
              min={0}
              max={999}
              step={1}
              disabled={saveMutation.isPending}
              value={form.titles ?? ""}
              onChange={(event) =>
                updateField(
                  "titles",
                  optionalNumber(
                    event.target.value,
                  ) ?? 0,
                )
              }
            />
          </Field>
        </div>

        <Field label="Biografia">
          <textarea
            rows={4}
            className="w-full resize-none rounded-2xl border border-border bg-background p-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
            placeholder="Conte um pouco sobre você e seu estilo de jogo..."
            maxLength={160}
            disabled={saveMutation.isPending}
            value={form.bio ?? ""}
            onChange={(event) =>
              updateField(
                "bio",
                event.target.value,
              )
            }
          />

          <p className="mt-1 text-right text-xs text-muted-foreground">
            {form.bio?.length ?? 0}/160
          </p>
        </Field>
      </section>

      <div className="sticky bottom-4 z-20 flex gap-3 rounded-2xl border border-border bg-background/90 p-3 shadow-lift backdrop-blur">
        <Button
          type="button"
          variant="soft"
          size="lg"
          className="flex-1"
          disabled={saveMutation.isPending}
          onClick={onCancel}
        >
          Cancelar
        </Button>

        <Button
          type="submit"
          variant="hero"
          size="lg"
          className="flex-1"
          disabled={
            saveMutation.isPending ||
            !formChanged
          }
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando
            </>
          ) : (
            "Salvar perfil"
          )}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  helpText,
  children,
}: {
  label: string;
  helpText?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-muted-foreground">
        {label}
      </span>

      {children}

      {helpText && (
        <span className="mt-1.5 block text-xs text-muted-foreground">
          {helpText}
        </span>
      )}
    </label>
  );
}

function LoadingMessage({
  text,
  compact = false,
}: {
  text: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`grid place-items-center gap-3 ${
        compact ? "py-10" : "py-24"
      }`}
    >
      <Loader2 className="h-6 w-6 animate-spin text-primary" />

      <p className="text-sm text-muted-foreground">
        {text}
      </p>
    </div>
  );
}

function StatusMessage({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mx-4 mt-8 rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-center">
      <AlertCircle className="mx-auto h-7 w-7 text-destructive" />

      <p className="mt-2 font-bold">
        {title}
      </p>

      <p className="mt-1 text-sm text-muted-foreground">
        {description}
      </p>

      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
}

function validateProfile(params: {
  username: string;
  fullName: string;
  bio: string | null;
  birthDate: string | null;
  heightCm: number | null;
  weightKg: number | null;
  titles: number;
  avatar: File | null;
}) {
  if (params.username.length < 3) {
    throw new Error(
      "O nome de usuário precisa ter pelo menos 3 caracteres.",
    );
  }

  if (params.username.length > 30) {
    throw new Error(
      "O nome de usuário pode ter no máximo 30 caracteres.",
    );
  }

  if (
    !/^[a-z0-9._]+$/.test(params.username)
  ) {
    throw new Error(
      "Use apenas letras, números, ponto ou underline no nome de usuário.",
    );
  }

  if (!params.fullName) {
    throw new Error(
      "Informe seu nome completo.",
    );
  }

  if (params.fullName.length > 80) {
    throw new Error(
      "O nome completo pode ter no máximo 80 caracteres.",
    );
  }

  if (
    params.birthDate &&
    params.birthDate > getTodayDate()
  ) {
    throw new Error(
      "A data de nascimento não pode estar no futuro.",
    );
  }

  if (
    params.heightCm !== null &&
    (params.heightCm < 100 ||
      params.heightCm > 250)
  ) {
    throw new Error(
      "Informe uma altura entre 100 e 250 cm.",
    );
  }

  if (
    params.weightKg !== null &&
    (params.weightKg < 30 ||
      params.weightKg > 300)
  ) {
    throw new Error(
      "Informe um peso entre 30 e 300 kg.",
    );
  }

  if (
    params.titles < 0 ||
    params.titles > 999
  ) {
    throw new Error(
      "Informe uma quantidade de títulos entre 0 e 999.",
    );
  }

  if (
    params.bio &&
    params.bio.length > 160
  ) {
    throw new Error(
      "A biografia pode ter no máximo 160 caracteres.",
    );
  }

  if (
    params.avatar &&
    params.avatar.size > MAX_AVATAR_SIZE
  ) {
    throw new Error(
      "A imagem pode ter no máximo 5 MB.",
    );
  }

  if (
    params.avatar &&
    !ALLOWED_AVATAR_TYPES.includes(
      params.avatar.type,
    )
  ) {
    throw new Error(
      "Selecione uma imagem PNG, JPG ou WebP.",
    );
  }
}

function normalizeUsername(
  username: string,
) {
  return username
    .trim()
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/\s+/g, "_");
}

function normalizeUsernameInput(
  username: string,
) {
  return username
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9._]/g, "");
}

function getProfileInitial(
  profile: Profile,
) {
  return (
    profile.full_name ||
    profile.username ||
    "?"
  )
    .trim()
    .charAt(0)
    .toUpperCase();
}

function hasProfileChanged(
  original: Profile,
  current: Profile,
) {
  return (
    original.username !==
      current.username ||
    original.full_name !==
      current.full_name ||
    original.city !== current.city ||
    original.birth_date !==
      current.birth_date ||
    original.height_cm !==
      current.height_cm ||
    original.weight_kg !==
      current.weight_kg ||
    original.dominant_foot !==
      current.dominant_foot ||
    original.position !==
      current.position ||
    original.bio !== current.bio ||
    original.titles !== current.titles
  );
}

function splitLocation(
  location?: string | null,
) {
  if (!location?.trim()) {
    return {
      city: null,
      state: null,
    };
  }

  const value = location.trim();

  const locationMatch = value.match(
    /^(.*?)(?:\s*[-–—,]\s*)([A-Za-z]{2})$/,
  );

  if (locationMatch) {
    return {
      city: locationMatch[1].trim(),
      state:
        locationMatch[2].toUpperCase(),
    };
  }

  return {
    city: value,
    state: null,
  };
}

function getTodayDate() {
  const now = new Date();

  const timezoneOffset =
    now.getTimezoneOffset() * 60_000;

  return new Date(
    now.getTime() - timezoneOffset,
  )
    .toISOString()
    .split("T")[0];
}

function getErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  return fallback;
}