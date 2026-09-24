import type { AiAction, AiActionContext, AiStorage } from "@slash-editor/core";
import type { Editor } from "@tiptap/core";
import { useCallback, useMemo } from "react";

export interface AiActions {
  actions: AiAction[];
  run: (action: AiAction, options?: { pos?: number }) => boolean;
}

function getStorage(editor: Editor): AiStorage | null {
  return editor.storage.ai ?? null;
}

export function useAiActions(editor: Editor | null, context: AiActionContext): AiActions {
  const actions = useMemo(
    () => editor?.storage.ai?.actions.filter((action) => action.contexts.includes(context)) ?? [],
    [editor, context],
  );
  const run = useCallback(
    (action: AiAction, options: { pos?: number } = {}) => {
      if (!editor || !getStorage(editor)) return false;
      const scope = context === "slash" ? "cursor" : context;
      return editor.commands.runAiAction({
        action: action.id,
        prompt: action.prompt,
        scope,
        pos: options.pos,
      });
    },
    [context, editor],
  );

  return { actions, run };
}
