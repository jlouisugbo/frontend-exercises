import { useCallback, useEffect, useState } from "react";

export type CommandMenuShortcutProps = {
  enabled: boolean;
};

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target.isContentEditable
  );
}

export function CommandMenuShortcut({ enabled }: CommandMenuShortcutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const handleShortcut = useCallback((event: KeyboardEvent) => {
    const isShortcut =
      event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey);

    if (
      !enabled ||
      !isShortcut ||
      event.repeat ||
      isEditableTarget(event.target)
    ) {
      return;
    }

    event.preventDefault();
    setIsOpen((current) => !current);
  }, [enabled]);

  useEffect(() => {
    document.addEventListener("keydown", handleShortcut);

    return () => {
      document.removeEventListener("keydown", handleShortcut);
    };
  }, []);

  return (
    <section aria-label="Command menu demo">
      <p>Press Ctrl+K or Command+K to open the command menu.</p>

      <label>
        Search page
        <input aria-label="Search page" />
      </label>

      {isOpen ? (
        <div role="dialog" aria-label="Command menu">
          <p>Jump to a project or action</p>
          <button type="button" onClick={() => setIsOpen(false)}>
            Close command menu
          </button>
        </div>
      ) : null}
    </section>
  );
}
