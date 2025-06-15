
import { useState, useEffect } from "react";
import { getPendingReviews, type PendingReview } from "@/services/pendingReviewsService";
import type { User } from "@supabase/supabase-js";

export const usePendingReviews = (user: User | null) => {
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadPendingReviews = async () => {
    if (!user) {
      setPendingReviews([]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await getPendingReviews();
      setPendingReviews(data);
    } catch (error) {
      console.error('Error loading pending reviews:', error);
      setPendingReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshReviews = () => {
    loadPendingReviews();
  };

  useEffect(() => {
    loadPendingReviews();
  }, [user]);

  return {
    pendingReviews,
    pendingCount: pendingReviews.length,
    isLoading,
    refreshReviews,
    setPendingReviews
  };
};
