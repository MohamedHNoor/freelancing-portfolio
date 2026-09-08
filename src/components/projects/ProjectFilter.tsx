"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { CategoryFacet, ProjectFilterState } from "@/lib/projects";

type ProjectFilterProps = {
  categories: readonly CategoryFacet[];
  stackEntries: readonly string[];
  value: ProjectFilterState;
  onChange: (next: ProjectFilterState) => void;
};

/* Plain buttons with `aria-pressed` rather than a roving-tabindex toggle group.
   Nine or so tab stops in two labelled groups is a pattern every assistive
   technology already handles, and it needs no new component and no focus
   management to get right.

   There is no Clear button on purpose: every group carries an `All` option, so
   clearing is one press on a control that is always present and always
   focusable. A Clear button would unmount at the moment it was used and drop
   focus to the body. */
function OptionButton({
  pressed,
  onPress,
  children,
}: {
  pressed: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={pressed ? "default" : "outline"}
      aria-pressed={pressed}
      onClick={onPress}
      className="h-8 rounded-full px-3.5 text-[0.8rem]"
    >
      {children}
    </Button>
  );
}

function FilterGroup({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div role="group" aria-labelledby={id}>
      <p
        id={id}
        className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground"
      >
        {label}
      </p>
      <ul role="list" className="mt-3 flex flex-wrap gap-2">
        {children}
      </ul>
    </div>
  );
}

export function ProjectFilter({
  categories,
  stackEntries,
  value,
  onChange,
}: ProjectFilterProps) {
  return (
    <div className="space-y-6">
      <FilterGroup id="filter-track" label="Track">
        <li>
          <OptionButton
            pressed={value.category === null}
            onPress={() => onChange({ ...value, category: null })}
          >
            All
          </OptionButton>
        </li>
        {categories.map((category) => (
          <li key={category.slug}>
            <OptionButton
              pressed={value.category === category.slug}
              onPress={() => onChange({ ...value, category: category.slug })}
            >
              {category.label}
            </OptionButton>
          </li>
        ))}
      </FilterGroup>

      <FilterGroup id="filter-stack" label="Technology">
        <li>
          <OptionButton
            pressed={value.stack === null}
            onPress={() => onChange({ ...value, stack: null })}
          >
            All
          </OptionButton>
        </li>
        {stackEntries.map((entry) => (
          <li key={entry}>
            <OptionButton
              pressed={value.stack === entry}
              onPress={() => onChange({ ...value, stack: entry })}
            >
              {entry}
            </OptionButton>
          </li>
        ))}
      </FilterGroup>
    </div>
  );
}
