// Copyright (c) ppy Pty Ltd <contact@ppy.sh>. Licensed under the GNU Affero General Public License v3.0.
// See the LICENCE file in the repository root for full licence text.

import { route } from 'laroute';
import * as _ from 'lodash';
import { observer } from 'mobx-react';
import { Name, TYPES } from 'models/notification-type';
import { NotificationContext } from 'notifications-context';
import LegacyPm from 'notifications/legacy-pm';
import NotificationController from 'notifications/notification-controller';
import NotificationReadButton from 'notifications/notification-read-button';
import core from 'osu-core-singleton';
import * as React from 'react';
import { ShowMoreLink } from 'show-more-link';
import Stack from './stack';

interface Props {
  extraClasses?: string;
}

interface State {
  hasError: boolean;
}

@observer
export default class Main extends React.Component<Props, State> {
  readonly links = TYPES.map((obj) => {
    const type = obj.type;
    return { title: osu.trans(`notifications.filters.${type ?? '_'}`), data: { 'data-type': type }, type };
  });

  readonly state = {
    hasError: false,
  };

  private readonly controller = new NotificationController(core.dataStore.notificationStore, { isWidget: true }, null);

  static getDerivedStateFromError(error: Error) {
    // tslint:disable-next-line: no-console
    console.error(error);
    return { hasError: true };
  }

  render() {
    const blockClass = `notification-popup u-fancy-scrollbar ${this.props.extraClasses ?? ''}`;

    return (
      <NotificationContext.Provider value={{ isWidget: true }}>
        <div className={blockClass}>
          <div className='notification-popup__scroll-container'>
            {this.renderFilters()}
            <div className='notification-popup__buttons'>
              {this.renderHistoryLink()}
              <div className='notification-popup__clear-button'>
                {this.renderMarkAsReadButton()}
              </div>
            </div>
            {this.renderLegacyPm()}
            <div className='notification-stacks'>
              {this.renderStacks()}
              {this.renderShowMore()}
            </div>
          </div>
        </div>
      </NotificationContext.Provider>
    );
  }

  private handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const type = ((event.currentTarget as HTMLButtonElement).dataset.type ?? null) as Name;
    this.controller.navigateTo(type);
  }

  private handleMarkAsRead = () => {
    this.controller.type.markTypeAsRead();
  }

  private handleShowMore = () => {
    this.controller.loadMore();
  }

  private renderFilter = (link: any) => {
    const type = core.dataStore.notificationStore.unreadStacks.getOrCreateType({ objectType: link.type });
    const isSameFilter = link.type === this.controller.currentFilter;

    if (type.name !== null && type.isEmpty && !isSameFilter) return null;

    const data = { 'data-type': link.type };
    const modifiers = isSameFilter ? ['active'] : [];

    return (
      <button
        className={osu.classWithModifiers('notification-popup__filter', modifiers)}
        key={link.title}
        onClick={this.handleFilterClick}
        {...data}
      >
        <span className='notification-popup__filter-count'>{type.total}</span>
        <span>{link.title}</span>
      </button>
    );
  }

  private renderFilters() {
    return (
      <div className='notification-popup__filters'>
        {this.links.map(this.renderFilter)}
      </div>
    );
  }

  private renderHistoryLink() {
    return (
      <a href={route('notifications.index')}>
        {osu.trans('notifications.see_all')}
      </a>
    );
  }

  private renderLegacyPm() {
    if (this.controller.currentFilter != null) return;

    return <LegacyPm />;
  }

  private renderMarkAsReadButton() {
    const type = this.controller.type;
    if (type.isEmpty) return null;

    return (
      <NotificationReadButton
        isMarkingAsRead={type.isMarkingAsRead}
        onMarkAsRead={this.handleMarkAsRead}
        text={osu.trans('notifications.mark_read', { type: osu.trans(`notifications.filters.${type.name ?? '_'}`) })}
      />
    );
  }

  private renderShowMore() {
    const type = this.controller.type;

    return (
      <ShowMoreLink
        callback={this.handleShowMore}
        hasMore={type?.hasMore}
        loading={type?.isLoading}
        modifiers={['notification-group', 'notification-list']}
      />
    );
  }

  private renderStacks() {
    if (this.state.hasError) {
      return;
    }

    const nodes: React.ReactNode[] = [];
    for (const stack of this.controller.stacks) {
      if (!stack.hasVisibleNotifications) continue;

      nodes.push(<Stack key={stack.id} stack={stack} />);
    }

    if (nodes.length === 0) {
      const transKey = this.controller.currentFilter == null ? 'notifications.all_read' : 'notifications.none';
      return (
        <p key='empty' className='notification-popup__empty'>
          {osu.trans(transKey)}
        </p>
      );
    }

    return nodes;
  }
}
