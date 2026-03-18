import {useEffect, useState} from 'react';
import {SERVER_URL} from '@env';

type ReferralStats = {
  friendsReferred: number;
  earnedLast7d: string;
  totalRewards: string;
};

type ReferralUser = {
  username: string;
  profile_image_url: string | null;
  status: 'PENDING' | 'COMPLETED' | 'REWARDED';
  fees_earned: string;
};

export function useReferrals(userPrivyId?: string) {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<ReferralUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
     if (!userPrivyId) {
      setStats(null);
      setReferrals([]);
      return;
    }

    let mounted = true;

    const fetchReferrals = async () => {
      try {
        const res = await fetch(
          `${SERVER_URL}/api/userRoutess/referrals/${userPrivyId}`,
        );
        const json = await res.json();

        if (!mounted || !json.success) return;

        setStats(json.stats);
        setReferrals(json.referrals);
      } catch (e) {
        console.error('Failed to load referrals', e);
      } finally {
        mounted && setLoading(false);
      }
    };

    fetchReferrals();
    return () => {
      mounted = false;
    };
  }, [userPrivyId]);

  return {stats, referrals, loading};
}
