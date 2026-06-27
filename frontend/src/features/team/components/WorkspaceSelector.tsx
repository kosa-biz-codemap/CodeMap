"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";
import type { TeamWorkspace } from "@/common/types/contracts";
import { createTeam, fetchTeams, inviteTeamMember } from "@/features/analysis/api/api";

export type WorkspaceScope = "private" | "team";

interface WorkspaceSelectorProps {
  scope: WorkspaceScope;
  selectedTeamId: string | null;
  isDark: boolean;
  isKo: boolean;
  onSelectionChange: (selection: {
    scope: WorkspaceScope;
    teamId: string | null;
    teamName: string | null;
  }) => void;
}

function getTeamId(team: TeamWorkspace): string {
  return team.teamId || team.id;
}

export function WorkspaceSelector({
  scope,
  selectedTeamId,
  isDark,
  isKo,
  onSelectionChange,
}: WorkspaceSelectorProps) {
  const [teams, setTeams] = useState<TeamWorkspace[]>([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selectedTeam = useMemo(
    () => teams.find((team) => getTeamId(team) === selectedTeamId) || null,
    [selectedTeamId, teams],
  );

  const selectWorkspace = useCallback((
    nextScope: WorkspaceScope,
    team: TeamWorkspace | null = selectedTeam,
  ) => {
    const teamId = team ? getTeamId(team) : selectedTeamId;
    onSelectionChange({
      scope: nextScope,
      teamId,
      teamName: nextScope === "team" ? team?.name || null : null,
    });
  }, [onSelectionChange, selectedTeam, selectedTeamId]);

  const loadTeams = useCallback(async () => {
    try {
      const nextTeams = await fetchTeams();
      setTeams(nextTeams);
      if (!selectedTeamId && nextTeams.length > 0) {
        onSelectionChange({
          scope,
          teamId: getTeamId(nextTeams[0]),
          teamName: nextTeams[0].name,
        });
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "팀 목록을 불러오지 못했습니다.");
    }
  }, [onSelectionChange, scope, selectedTeamId]);

  useEffect(() => {
    queueMicrotask(() => void loadTeams());
  }, [loadTeams]);

  const handleCreateTeam = async () => {
    const name = newTeamName.trim();
    if (!name || busy) return;
    setBusy(true);
    setError(null);
    try {
      const team = await createTeam(name);
      const teamId = getTeamId(team);
      setTeams((current) => [team, ...current.filter((item) => getTeamId(item) !== teamId)]);
      onSelectionChange({ scope: "team", teamId, teamName: team.name });
      setNewTeamName("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "팀을 생성하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const handleInviteMember = async () => {
    const email = inviteEmail.trim();
    if (!selectedTeamId || !email || busy) return;
    setBusy(true);
    setError(null);
    try {
      await inviteTeamMember(selectedTeamId, email);
      setInviteEmail("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "팀원을 초대하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`mb-3 rounded-2xl border p-3 ${isDark ? "border-zinc-800 bg-zinc-900/60" : "border-zinc-200 bg-white"}`}>
      <div className="mb-2 flex items-center gap-2">
        <Users className="size-3.5 text-blue-400" />
        <span className={`text-xs font-bold ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>{isKo ? "워크스페이스" : "Workspace"}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => selectWorkspace("private", null)}
          className={`rounded-lg border px-2.5 py-2 text-left text-[11px] font-semibold transition ${scope === "private" ? "border-blue-500 bg-blue-500/10 text-blue-400" : isDark ? "border-zinc-800 text-zinc-500 hover:bg-zinc-900" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}
        >
          Private
        </button>
        <button
          type="button"
          onClick={() => selectWorkspace("team")}
          disabled={!selectedTeamId}
          className={`rounded-lg border px-2.5 py-2 text-left text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${scope === "team" ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : isDark ? "border-zinc-800 text-zinc-500 hover:bg-zinc-900" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}
        >
          Team
        </button>
      </div>
      {teams.length > 0 && (
        <select
          value={selectedTeamId || ""}
          onChange={(event) => {
            const team = teams.find((item) => getTeamId(item) === event.target.value) || null;
            onSelectionChange({
              scope: event.target.value ? "team" : "private",
              teamId: team ? getTeamId(team) : null,
              teamName: team?.name || null,
            });
          }}
          className={`mt-2 w-full rounded-lg border px-2.5 py-2 text-[11px] outline-none ${isDark ? "border-zinc-800 bg-zinc-950 text-zinc-200" : "border-zinc-200 bg-white text-zinc-800"}`}
        >
          {teams.map((team) => (
            <option key={getTeamId(team)} value={getTeamId(team)}>
              {team.name} · {team.role}
            </option>
          ))}
        </select>
      )}
      <div className="mt-2 grid gap-2">
        <div className="flex gap-1.5">
          <input
            value={newTeamName}
            onChange={(event) => setNewTeamName(event.target.value)}
            placeholder={isKo ? "새 팀 이름" : "New team name"}
            className={`min-w-0 flex-1 rounded-lg border px-2.5 py-2 text-[11px] outline-none ${isDark ? "border-zinc-800 bg-zinc-950 text-zinc-200 placeholder:text-zinc-600" : "border-zinc-200 bg-white text-zinc-800 placeholder:text-zinc-400"}`}
          />
          <button type="button" onClick={handleCreateTeam} disabled={busy || !newTeamName.trim()} className={`rounded-lg px-2.5 text-[10px] font-bold disabled:opacity-40 ${isDark ? "bg-white text-black" : "bg-zinc-900 text-white"}`}>
            {isKo ? "생성" : "Create"}
          </button>
        </div>
        {selectedTeamId && (
          <div className="flex gap-1.5">
            <input
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder={isKo ? "초대할 이메일" : "Invite email"}
              className={`min-w-0 flex-1 rounded-lg border px-2.5 py-2 text-[11px] outline-none ${isDark ? "border-zinc-800 bg-zinc-950 text-zinc-200 placeholder:text-zinc-600" : "border-zinc-200 bg-white text-zinc-800 placeholder:text-zinc-400"}`}
            />
            <button type="button" onClick={handleInviteMember} disabled={busy || !inviteEmail.trim()} className="rounded-lg bg-blue-600 px-2.5 text-[10px] font-bold text-white disabled:opacity-40">
              {isKo ? "초대" : "Invite"}
            </button>
          </div>
        )}
      </div>
      <p className={`mt-2 text-[10px] leading-4 ${isDark ? "text-zinc-600" : "text-zinc-500"}`}>
        {scope === "team" && selectedTeam
          ? `${selectedTeam.name} 팀 멤버에게만 분석 이력과 대화가 공유됩니다.`
          : "개인 기록은 본인 계정에서만 보입니다."}
      </p>
      {error && <p className="mt-2 text-[10px] font-medium text-red-400">{error}</p>}
    </div>
  );
}
