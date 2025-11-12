'use client';

import { useState } from 'react';
import { trpc } from '@/trpc/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@fieldform/ui';
import Link from 'next/link';

export default function TeamsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [selectedTeamForMember, setSelectedTeamForMember] = useState<string>('');

  const { data: teams, refetch } = trpc.teams.list.useQuery();
  const { data: availableMembers } = trpc.teams.getAvailableMembers.useQuery();
  const createMutation = trpc.teams.create.useMutation();
  const addMemberMutation = trpc.teams.addMember.useMutation();
  const removeMemberMutation = trpc.teams.removeMember.useMutation();
  const deleteMutation = trpc.teams.delete.useMutation();

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        name: newTeamName,
        description: newTeamDescription || undefined,
      });
      setNewTeamName('');
      setNewTeamDescription('');
      setShowCreateForm(false);
      refetch();
      alert('Team created successfully!');
    } catch (error) {
      alert('Failed to create team');
    }
  };

  const handleAddMember = async (teamId: string, userId: string) => {
    try {
      await addMemberMutation.mutateAsync({ teamId, userId });
      refetch();
      alert('Member added successfully!');
    } catch (error) {
      alert('Failed to add member');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Remove this member from the team?')) return;
    try {
      await removeMemberMutation.mutateAsync({ userId });
      refetch();
      alert('Member removed successfully!');
    } catch (error) {
      alert('Failed to remove member');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Delete this team? This will unassign all members.')) return;
    try {
      await deleteMutation.mutateAsync({ id: teamId });
      refetch();
      alert('Team deleted successfully!');
    } catch (error) {
      alert('Failed to delete team');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Teams</h1>
              <p className="text-sm text-muted-foreground">
                Manage teams and assign members
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowCreateForm(true)}>+ Create Team</Button>
              <Link href="/dashboard">
                <Button variant="outline">← Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Create Team Form */}
        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Team</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Team Name *</label>
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="e.g., Field Team Alpha"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={newTeamDescription}
                    onChange={(e) => setNewTeamDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Brief description..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Creating...' : 'Create Team'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Teams List */}
        {teams && teams.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {teams.map((team) => (
              <Card key={team.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{team.name}</CardTitle>
                      {team.description && (
                        <CardDescription>{team.description}</CardDescription>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600"
                      onClick={() => handleDeleteTeam(team.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Members ({team.members.length})</h3>
                      <span className="text-sm text-muted-foreground">
                        {team._count.workOrders} work orders
                      </span>
                    </div>
                    
                    {team.members.length > 0 ? (
                      <div className="space-y-2">
                        {team.members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-2 border rounded"
                          >
                            <div>
                              <div className="font-medium">{member.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {member.email}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No members yet</p>
                    )}
                  </div>

                  {/* Add Member */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Add Member</label>
                    <div className="flex gap-2">
                      <select
                        value={selectedTeamForMember === team.id ? '' : ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddMember(team.id, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="flex-1 px-3 py-2 border rounded-md text-sm"
                      >
                        <option value="">Select operator...</option>
                        {availableMembers
                          ?.filter((m) => !team.members.some((tm) => tm.id === m.id))
                          .map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name} - {member.email}
                              {member.teamId && member.team?.name
                                ? ` (currently in ${member.team.name})`
                                : ''}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No teams yet</p>
              <Button onClick={() => setShowCreateForm(true)}>Create your first team</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

