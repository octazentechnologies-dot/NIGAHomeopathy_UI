import React, { useCallback, useState } from 'react';
import useContainerInfiniteLoad from '../../hooks/useContainerInfiniteLoad';

const bindRef = (ref, node) => {
  if (!ref) return;
  if (typeof ref === 'function') {
    ref(node);
    return;
  }
  ref.current = node;
};

const InfiniteScrollContainer = ({
  className,
  style,
  hasMore = false,
  loading = false,
  itemCount = 0,
  onLoadMore,
  enabled = true,
  innerRef,
  children,
}) => {
  const [root, setRoot] = useState(null);
  const [sentinel, setSentinel] = useState(null);

  const setRootNode = useCallback((node) => {
    setRoot((prev) => (prev === node ? prev : node));
    bindRef(innerRef, node);
  }, [innerRef]);

  const setSentinelNode = useCallback((node) => {
    setSentinel((prev) => (prev === node ? prev : node));
  }, []);

  useContainerInfiniteLoad({
    enabled: Boolean(enabled && itemCount > 0),
    hasMore: Boolean(hasMore),
    loading: Boolean(loading),
    itemCount,
    onLoadMore,
    root,
    sentinel,
  });

  return (
    <div className={className} style={style} ref={setRootNode}>
      {children}
      {hasMore && (
        <span
          ref={setSentinelNode}
          className="pb-infinite-sentinel"
          aria-hidden="true"
          style={{ display: 'block', width: '100%', height: 1, overflow: 'hidden', pointerEvents: 'none' }}
        />
      )}
    </div>
  );
};

export default InfiniteScrollContainer;
