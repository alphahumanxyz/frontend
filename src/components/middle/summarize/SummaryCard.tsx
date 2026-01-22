import type { FC } from '../../../lib/teact/teact';
import { memo } from '../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../global';

import type { ChatSummary } from '../../../types';

import { selectChat } from '../../../global/selectors';
import buildClassName from '../../../util/buildClassName';
import { createMessageHashUrl } from '../../../util/routing';

import useLang from '../../../hooks/useLang';
import useLastCallback from '../../../hooks/useLastCallback';

import Avatar from '../../common/Avatar';
import Button from '../../ui/Button';

import './SummaryCard.scss';

type OwnProps = {
  summary: ChatSummary;
  onClick?: NoneToVoidFunction;
};

type StateProps = {
  chat?: ReturnType<typeof selectChat>;
};

const SummaryCard: FC<OwnProps & StateProps> = ({
  summary,
  onClick,
  chat,
}) => {
  const { openChat } = getActions();
  const lang = useLang();

  const handleMessageLinkClick = useLastCallback((chatId: string, messageId: number) => {
    const url = createMessageHashUrl(chatId, 'thread', 0);
    window.location.hash = url.split('#')[1];
    openChat({ id: chatId });
  });

  const handleCardClick = useLastCallback(() => {
    if (onClick) {
      onClick();
    }
    if (chat) {
      openChat({ id: chat.id });
    }
  });

  const renderContent = () => {
    const { paragraphs, actionItems, messageLinks } = summary.content;

    return (
      <div className="SummaryCard__content">
        {paragraphs.map((paragraph, index) => {
          let text = paragraph;
          const links: Array<{ text: string; chatId: string; messageId: number; start: number; end: number }> = [];

          if (messageLinks) {
            messageLinks.forEach((link) => {
              const index = text.indexOf(link.text);
              if (index !== -1) {
                links.push({
                  ...link,
                  start: index,
                  end: index + link.text.length,
                });
              }
            });
          }

          links.sort((a, b) => b.start - a.start);

          const parts: Array<string | { text: string; chatId: string; messageId: number }> = [];
          let lastIndex = text.length;

          links.forEach((link) => {
            if (link.end <= lastIndex) {
              parts.unshift(
                text.substring(link.end, lastIndex),
                { text: link.text, chatId: link.chatId, messageId: link.messageId },
                text.substring(link.start, link.end),
              );
              lastIndex = link.start;
            }
          });

          if (lastIndex > 0) {
            parts.unshift(text.substring(0, lastIndex));
          }

          return (
            <p key={index} className="SummaryCard__paragraph">
              {parts.map((part, partIndex) => {
                if (typeof part === 'string') {
                  return <span key={partIndex}>{part}</span>;
                }
                return (
                  <a
                    key={partIndex}
                    href="#"
                    className="SummaryCard__link"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleMessageLinkClick(part.chatId, part.messageId);
                    }}
                  >
                    {part.text}
                  </a>
                );
              })}
            </p>
          );
        })}

        {actionItems && actionItems.length > 0 && (
          <div className="SummaryCard__action-items">
            <h4 className="SummaryCard__action-items-title">Action Items</h4>
            <ul className="SummaryCard__action-items-list">
              {actionItems.map((item, index) => (
                <li key={index} className="SummaryCard__action-item">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const date = new Date(summary.date * 1000);
  const dateString = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      className={buildClassName(
        'SummaryCard',
        summary.isRead && 'is-read',
      )}
      onClick={handleCardClick}
    >
      <div className="SummaryCard__header">
        <Avatar
          peer={chat}
          size="small"
        />
        <div className="SummaryCard__header-info">
          <div className="SummaryCard__chat-title">
            {chat?.title || 'Unknown Chat'}
          </div>
          <div className="SummaryCard__date">{dateString}</div>
        </div>
      </div>

      {renderContent()}

      {!summary.isRead && (
        <div className="SummaryCard__footer">
          <Button
            size="tiny"
            onClick={(e) => {
              e.stopPropagation();
              if (onClick) onClick();
            }}
          >
            Mark as Read
          </Button>
        </div>
      )}
    </div>
  );
};

export default memo(withGlobal<OwnProps>(
  (global, { summary }): StateProps => {
    return {
      chat: selectChat(global, summary.chatId),
    };
  },
)(SummaryCard));
