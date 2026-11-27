import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useReorderableDrag } from 'react-native-reorderable-list';
import TripItemCard from '@/components/TripItemCard';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/localization';
import type { TripItem } from '@/lib/queries/trips';

type TripItemCardProps = React.ComponentProps<typeof TripItemCard>;

interface ReorderablePlanItemProps extends Omit<TripItemCardProps, 'dragHandle'> {
  item: TripItem;
}

/**
 * A plan row inside a ReorderableList (#15). Editors start dragging by
 * long-pressing the card or touching the handle (≡); viewers just see the card.
 */
export function ReorderablePlanItem({ canEdit, ...cardProps }: ReorderablePlanItemProps) {
  const drag = useReorderableDrag();
  const theme = useTheme();
  const { t } = useTranslation();

  const handle = canEdit ? (
    <Pressable
      onPressIn={drag}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={t('item.dragHandle')}
      style={styles.handle}
    >
      <IconSymbol name="line.3.horizontal" size={22} color={theme.textSecondary} />
    </Pressable>
  ) : null;

  return (
    <Pressable onLongPress={canEdit ? drag : undefined} delayLongPress={250}>
      <TripItemCard {...cardProps} canEdit={canEdit} dragHandle={handle} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  handle: {
    paddingLeft: 8,
    paddingVertical: 2,
  },
});
