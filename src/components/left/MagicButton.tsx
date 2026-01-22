import type { FC } from '../../lib/teact/teact';
import {
  useCallback, useEffect, useState,
} from '../../lib/teact/teact';
import { getActions } from '../../global';

import { LeftColumnContent } from '../../types';
import buildClassName from '../../util/buildClassName';

import useOldLang from '../../hooks/useOldLang';

import Icon from '../common/icons/Icon';
import Button from '../ui/Button';

import './MagicButton.scss';

type OwnProps = {
  isShown: boolean;
  isAccountFrozen?: boolean;
};

const MagicButton: FC<OwnProps> = ({
  isShown,
  isAccountFrozen,
}) => {
  const { openFrozenAccountModal, openLeftColumnContent } = getActions();

  const lang = useOldLang();

  const fabClassName = buildClassName(
    'MagicButton',
    isShown && 'revealed',
  );

  const handleClick = useCallback(() => {
    if (isAccountFrozen) {
      openFrozenAccountModal();
      return;
    }

    openLeftColumnContent({ contentKey: LeftColumnContent.AlphahumanSidebar });
  }, [isAccountFrozen, openLeftColumnContent]);

  return (
    <div className={fabClassName} dir={lang.isRtl ? 'rtl' : undefined}>
      <Button
        color="secondary"
        className="magic-button"
        onClick={handleClick}
        ariaLabel="Open AI Assistant"
        tabIndex={-1}
      >
        <Icon name="star" />
        <span className="magic-text">Ask AI</span>
      </Button>
    </div>
  );
};

export default MagicButton;