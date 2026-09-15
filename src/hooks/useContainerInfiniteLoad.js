import { useEffect, useRef } from 'react';

const SCROLL_EPSILON_PX = 1;

export const isElementScrollable = (element) => {
  if (!element) return false;
  return element.scrollHeight - element.clientHeight > SCROLL_EPSILON_PX;
};

/**
 * Infinite loading against a real overflow container.
 * 1) After render, if the container is not scrollable and more data exists, load the next page.
 * 2) Once scrollable, IntersectionObserver on a bottom sentinel loads further pages.
 * Scrollability uses scrollHeight/clientHeight, not scrollbar appearance.
 */
const useContainerInfiniteLoad = ({
  enabled = true,
  hasMore = false,
  loading = false,
  itemCount = 0,
  onLoadMore,
  root,
  sentinel,
}) => {
  const onLoadMoreRef = useRef(onLoadMore);
  const observerRef = useRef(null);
  const fillFrameRef = useRef(0);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    if (!enabled || loading || !hasMore || itemCount <= 0 || !root) {
      return undefined;
    }

    let cancelled = false;
    const frame = window.requestAnimationFrame(() => {
      fillFrameRef.current = window.requestAnimationFrame(() => {
        if (cancelled || loading || !hasMore) return;
        if (!isElementScrollable(root)) {
          onLoadMoreRef.current?.();
        }
      });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(fillFrameRef.current);
    };
  }, [enabled, hasMore, loading, itemCount, root]);

  useEffect(() => {
    if (!enabled || !hasMore || loading || !root) {
      return undefined;
    }

    const onResize = () => {
      if (!isElementScrollable(root) && hasMore && !loading) {
        onLoadMoreRef.current?.();
      }
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [enabled, hasMore, loading, root]);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (!enabled || !hasMore || loading || !root || !sentinel) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries.find((item) => item.isIntersecting);
        if (!entry) return;
        onLoadMoreRef.current?.();
      },
      {
        root,
        rootMargin: '0px',
        threshold: 0,
      }
    );

    observer.observe(sentinel);
    observerRef.current = observer;

    return () => {
      observer.disconnect();
      if (observerRef.current === observer) {
        observerRef.current = null;
      }
    };
  }, [enabled, hasMore, loading, itemCount, root, sentinel]);
};

export default useContainerInfiniteLoad;
