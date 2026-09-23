import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import type { UseQueryResult } from '@tanstack/react-query';
import { colors } from '../constants/theme';
import { EmptyView, ErrorView, LoadingView } from './StateView';

const PAGE = 20;

interface Props<T> {
  query: UseQueryResult<T[]>;
  renderItem: (item: T) => React.ReactElement;
  keyExtractor: (item: T) => string;
  emptyTitle: string;
  emptyMessage?: string;
  header?: React.ReactElement;
  /** Client-side filter applied before paging. */
  filter?: (item: T) => boolean;
}

/**
 * List with the full set of states every data screen needs (loading, error, empty, pull-to-refresh)
 * and incremental rendering: the API returns full lists, so we reveal them PAGE items at a time
 * to keep FlatList light on low-end Android devices.
 */
export function QueryList<T>({ query, renderItem, keyExtractor, emptyTitle, emptyMessage, header, filter }: Props<T>) {
  const [shown, setShown] = useState(PAGE);
  const all = useMemo(() => (filter ? (query.data ?? []).filter(filter) : query.data ?? []), [query.data, filter]);
  const data = all.slice(0, shown);

  if (query.isLoading) return <><Head header={header} /><LoadingView /></>;
  if (query.isError) return <><Head header={header} /><ErrorView message={query.error.message} onRetry={() => query.refetch()} /></>;

  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      renderItem={({ item }) => renderItem(item)}
      ListHeaderComponent={header}
      ListEmptyComponent={<EmptyView title={emptyTitle} message={emptyMessage} />}
      refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={colors.brand} />}
      onEndReachedThreshold={0.4}
      onEndReached={() => all.length > shown && setShown((n) => n + PAGE)}
      initialNumToRender={10}
      windowSize={7}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    />
  );
}

const Head = ({ header }: { header?: React.ReactElement }) => header ?? null;
