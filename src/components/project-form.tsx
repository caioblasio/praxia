'use client';

import Link from 'next/link';
import { useActionState } from 'react';

import { createProject, type CreateProjectState } from '@/app/(protected)/projects/new/actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type OrgMemberOption = {
  id: string;
  name: string;
  role: string;
};

const initialState: CreateProjectState = {};

export function ProjectForm({ members }: { members: OrgMemberOption[] }) {
  const [state, formAction, pending] = useActionState(createProject, initialState);

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Create project</CardTitle>
        <CardDescription>
          Name the project and optionally add members from your organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="create-project-form" action={formAction} className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="name">Project name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="e.g. Downtown renovation"
              required
              autoFocus
            />
          </div>

          <div className="grid gap-3">
            <div>
              <Label>Members</Label>
              <p className="text-muted-foreground mt-1 text-xs">
                Select organization members to add to this project.
              </p>
            </div>

            {!members.length ? (
              <p className="text-muted-foreground text-sm">
                No other members in your organization yet.
              </p>
            ) : (
              <ul className="max-h-64 space-y-3 overflow-y-auto rounded-lg border p-3">
                {members.map((member) => (
                  <li key={member.id} className="flex items-center gap-3">
                    <Checkbox id={`member-${member.id}`} name="memberIds" value={member.id} />
                    <Label htmlFor={`member-${member.id}`} className="flex flex-1 flex-col gap-0.5">
                      <span>{member.name}</span>
                      <span className="text-muted-foreground text-xs capitalize">
                        {member.role}
                      </span>
                    </Label>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {state.error ? <p className="text-destructive text-sm">{state.error}</p> : null}
        </form>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          render={<Link href="/projects" />}
          nativeButton={false}
        >
          Cancel
        </Button>
        <Button type="submit" form="create-project-form" disabled={pending}>
          {pending ? 'Creating...' : 'Create project'}
        </Button>
      </CardFooter>
    </Card>
  );
}
