import reducer, {
  clearRolePreview,
  selectCanPreviewRoles,
  selectEffectiveRoles,
  setAssignedRole,
  setRolePreview,
} from "@/template/state/authorization/authorizationSlice";

import type {
  TemplateRootState,
} from "@/template/state/store/templateStoreTypes";

function createRootState(
  authorization:
    ReturnType<typeof reducer>,
): TemplateRootState {
  return {
    authorization,
  } as unknown as TemplateRootState;
}

describe(
  "authorizationSlice",
  () => {
    it(
      "starts as ADMIN without role preview",
      () => {
        const state =
          reducer(
            undefined,
            {
              type: "@@INIT",
            },
          );

        expect(
          state.assignedRole,
        ).toBe("ADMIN");

        expect(
          state.previewRole,
        ).toBeNull();

        expect(
          selectCanPreviewRoles(
            createRootState(
              state,
            ),
          ),
        ).toBe(true);

        expect(
          selectEffectiveRoles(
            createRootState(
              state,
            ),
          ),
        ).toEqual([
          "ADMIN",
        ]);
      },
    );

    it(
      "allows ADMIN to preview USER",
      () => {
        const initial =
          reducer(
            undefined,
            {
              type: "@@INIT",
            },
          );

        const state =
          reducer(
            initial,
            setRolePreview(
              "USER",
            ),
          );

        expect(
          state.previewRole,
        ).toBe("USER");

        expect(
          selectEffectiveRoles(
            createRootState(
              state,
            ),
          ),
        ).toEqual([
          "USER",
        ]);
      },
    );

    it(
      "allows ADMIN to preview EDITOR",
      () => {
        const initial =
          reducer(
            undefined,
            {
              type: "@@INIT",
            },
          );

        const state =
          reducer(
            initial,
            setRolePreview(
              "EDITOR",
            ),
          );

        expect(
          selectEffectiveRoles(
            createRootState(
              state,
            ),
          ),
        ).toEqual([
          "EDITOR",
        ]);
      },
    );

    it(
      "clears preview when assigned role changes away from ADMIN",
      () => {
        let state =
          reducer(
            undefined,
            {
              type: "@@INIT",
            },
          );

        state =
          reducer(
            state,
            setRolePreview(
              "USER",
            ),
          );

        state =
          reducer(
            state,
            setAssignedRole(
              "EDITOR",
            ),
          );

        expect(
          state.assignedRole,
        ).toBe("EDITOR");

        expect(
          state.previewRole,
        ).toBeNull();

        expect(
          selectCanPreviewRoles(
            createRootState(
              state,
            ),
          ),
        ).toBe(false);

        expect(
          selectEffectiveRoles(
            createRootState(
              state,
            ),
          ),
        ).toEqual([
          "EDITOR",
        ]);
      },
    );

    it(
      "does not allow non-ADMIN roles to set a preview",
      () => {
        let state =
          reducer(
            undefined,
            {
              type: "@@INIT",
            },
          );

        state =
          reducer(
            state,
            setAssignedRole(
              "USER",
            ),
          );

        state =
          reducer(
            state,
            setRolePreview(
              "EDITOR",
            ),
          );

        expect(
          state.previewRole,
        ).toBeNull();

        expect(
          selectEffectiveRoles(
            createRootState(
              state,
            ),
          ),
        ).toEqual([
          "USER",
        ]);
      },
    );

    it(
      "clears an existing ADMIN preview explicitly",
      () => {
        let state =
          reducer(
            undefined,
            {
              type: "@@INIT",
            },
          );

        state =
          reducer(
            state,
            setRolePreview(
              "EDITOR",
            ),
          );

        state =
          reducer(
            state,
            clearRolePreview(),
          );

        expect(
          state.previewRole,
        ).toBeNull();

        expect(
          selectEffectiveRoles(
            createRootState(
              state,
            ),
          ),
        ).toEqual([
          "ADMIN",
        ]);
      },
    );

    it(
      "reuses stable effective role arrays",
      () => {
        const state =
          reducer(
            undefined,
            {
              type: "@@INIT",
            },
          );

        const first =
          selectEffectiveRoles(
            createRootState(
              state,
            ),
          );

        const second =
          selectEffectiveRoles(
            createRootState(
              state,
            ),
          );

        expect(
          second,
        ).toBe(first);
      },
    );
  },
);
