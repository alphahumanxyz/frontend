import type { FormEvent } from 'react';
import type { FC } from '../../../lib/teact/teact';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from '../../../lib/teact/teact';

import buildClassName from '../../../util/buildClassName';

import useLang from '../../../hooks/useLang';

import DropdownMenu from '../../ui/DropdownMenu';
import MenuItem from '../../ui/MenuItem';

import styles from './AgentSidebar.module.scss';

type OwnProps = {
  onSend: (content: string) => void;
  disabled?: boolean;
  className?: string;
};

const MAX_INPUT_HEIGHT = 120; // 6 lines approximately

const ChatInput: FC<OwnProps> = ({
  onSend,
  disabled,
  className,
}) => {
  const lang = useLang();
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>();

  const handleSubmit = useCallback((e?: FormEvent) => {
    e?.preventDefault();

    if (!inputValue.trim() || disabled) return;

    onSend(inputValue.trim());
    setInputValue('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [inputValue, disabled, onSend]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleInput = useCallback((e: Event) => {
    const target = e.target as HTMLTextAreaElement;
    const { value } = target;

    setInputValue(value);

    // Auto-resize textarea
    target.style.height = 'auto';
    const newHeight = Math.min(target.scrollHeight, MAX_INPUT_HEIGHT);
    target.style.height = `${newHeight}px`;
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.addEventListener('keydown', handleKeyPress);
    textarea.addEventListener('input', handleInput);

    return () => {
      textarea.removeEventListener('keydown', handleKeyPress);
      textarea.removeEventListener('input', handleInput);
    };
  }, [handleKeyPress, handleInput]);

  const canSend = inputValue.trim() && !disabled;

  const AskDropdownTrigger: FC<{ onTrigger: () => void; isOpen?: boolean }> = useMemo(() => ({ onTrigger }) => (
    <button
      type="button"
      onClick={onTrigger}
      className={styles.controlsDropdown}
    >
      <span>Ask</span>
      <i className="icon icon-down" />
    </button>
  ), []);

  return (
    <div className={buildClassName(styles.chatInputContainer, className)}>
      <form onSubmit={handleSubmit} className={styles.chatInputWrapper}>
        <textarea
          ref={textareaRef}
          value={inputValue}
          placeholder="Ask a question..."
          disabled={disabled}
          className={styles.chatInputField}
          rows={1}
          dir="auto"
        />
        <button
          type="submit"
          disabled={!canSend}
          className={buildClassName(
            styles.sendButton,
            canSend && styles.sendButtonActive,
          )}
          aria-label={lang('Send')}
        >
          <i className="icon icon-send" />
        </button>
      </form>
      <div className={styles.controlsBar}>
        <div className={styles.controlsLeft}>
          <DropdownMenu
            trigger={AskDropdownTrigger}
            positionY="top"
          >
            <MenuItem>Ask</MenuItem>
            <MenuItem>Chat</MenuItem>
            <MenuItem>Generate</MenuItem>
          </DropdownMenu>
        </div>
        <div className={styles.controlsRight}>
          <button
            type="button"
            className={styles.controlsIconButton}
            aria-label="Folder"
          >
            <i className="icon icon-folder" />
          </button>
          <button
            type="button"
            className={styles.controlsIconButton}
            aria-label="Filter"
          >
            <i className="icon icon-sort" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(ChatInput);
