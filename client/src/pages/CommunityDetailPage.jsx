/**
 * DEVVERSE — Community Detail & Forum Page
 *
 * Grounded in Phase 1 community.html and js/pages/community.js.
 * Displays:
 *   - Community banner with gradient badge, guild title, and description
 *   - Live member and online metrics grounded in MongoDB records
 *   - Authenticated Join/Leave toggle with optimistic updates & error rollback
 *   - Guild membership status indicator
 *   - Curated guild threads preview with clean roadmap gating to Prompt 26
 *   - Loading and graceful 404 not-found states
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import communityService from '../services/communityService';
import { useAuth } from '../context/AuthContext';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import StatusMessage from '../components/ui/StatusMessage';

const TECH_GRADIENTS = [
  'linear-gradient(135deg, #7c6fff, #4fe3c1)',
  'linear-gradient(135deg, #ff6b5b, #7c6fff)',
  'linear-gradient(135deg, #4fe3c1, #ffb86b)',
  'linear-gradient(135deg, #ffb86b, #ff6b5b)',
  'linear-gradient(135deg, #7c6fff, #ff6b5b)',
];

// Grounded Phase 1 guild seed discussions
const FORUM_SEED_PREVIEWS = {
  c1: [
    {
      title: 'Why we moved off REST for internal services',
      author: 'kmori',
      timeAgo: '1h ago',
      body: 'We swapped most internal service-to-service calls to gRPC over the last quarter. Latency dropped noticeably and generated types killed a whole category of bugs.',
      replies: 2,
    },
    {
      title: 'Borrow checker fights: share your worst one',
      author: 'dax',
      timeAgo: '5h ago',
      body: 'Spent four hours yesterday fighting a lifetime issue that turned out to be a one-line fix. What is the borrow-checker battle that humbled you the most?',
      replies: 0,
    },
  ],
  c2: [
    {
      title: 'Best practices for component libraries in 2026',
      author: 'ari-devs',
      timeAgo: '3h ago',
      body: 'Curious what the consensus is now — headless components + your own styling layer, or a fully-styled system you theme on top of?',
      replies: 1,
    },
    {
      title: 'Anyone actually shipping with View Transitions API?',
      author: 'sena.codes',
      timeAgo: '9h ago',
      body: 'It looks great in demos but I am nervous about real-world support and edge cases with dynamic lists.',
      replies: 0,
    },
  ],
  c3: [
    {
      title: 'Consensus algorithms worth learning this year',
      author: 'kmori',
      timeAgo: '4h ago',
      body: 'Raft gets all the attention in tutorials, but I have been reading about EPaxos for leaderless properties. Anyone using it outside academia?',
      replies: 3,
    },
  ],
};

export default function CommunityDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadCommunity() {
      setLoading(true);
      setError(null);
      setActionNotice(null);

      try {
        const data = await communityService.getCommunity(id);
        if (isMounted) setCommunity(data);
      } catch (err) {
        if (isMounted) {
          setError(err.message || `Unable to load community "${id}".`);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCommunity();
    return () => {
      isMounted = false;
    };
  }, [id, user]);

  const handleToggleJoin = async () => {
    if (!user) {
      setActionNotice({
        type: 'warning',
        message: 'Please sign in to join communities.',
      });
      return;
    }

    if (!community || actionLoading) return;
    setActionLoading(true);
    setActionNotice(null);

    const isMember = community.isMember;
    const slug = community.slug || community.id;

    // Optimistic UI update
    setCommunity((prev) => ({
      ...prev,
      isMember: !isMember,
      membersCount: Math.max(0, (prev.membersCount || 0) + (isMember ? -1 : 1)),
    }));

    try {
      if (isMember) {
        const res = await communityService.leaveCommunity(slug);
        if (typeof res?.membersCount === 'number') {
          setCommunity((prev) => ({ ...prev, isMember: false, membersCount: res.membersCount }));
        }
        setActionNotice({ type: 'success', message: `You have left ${community.name}.` });
      } else {
        const res = await communityService.joinCommunity(slug);
        if (typeof res?.membersCount === 'number') {
          setCommunity((prev) => ({ ...prev, isMember: true, membersCount: res.membersCount }));
        }
        setActionNotice({ type: 'success', message: `Welcome to ${community.name}!` });
      }
    } catch (err) {
      // Revert optimistic update
      setCommunity((prev) => ({
        ...prev,
        isMember: isMember,
        membersCount: Math.max(0, (prev.membersCount || 0) + (isMember ? 1 : -1)),
      }));
      setActionNotice({
        type: 'error',
        message: err.message || 'Unable to update community membership.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 24px' }}>
        <LoadingState message="Loading community guild details..." />
      </div>
    );
  }

  if (error || !community) {
    return (
      <div style={{ maxWidth: '720px', margin: '60px auto', padding: '0 24px' }}>
        <EmptyState
          title="Community Not Found"
          message={error || `We could not find any community matching "${id}".`}
          actionLabel="← Back to Communities"
          onAction={() => window.location.assign('/communities')}
        />
      </div>
    );
  }

  const gradientBg = TECH_GRADIENTS[(community.gradient || 0) % TECH_GRADIENTS.length] || TECH_GRADIENTS[0];
  const previews = FORUM_SEED_PREVIEWS[community.slug] || [
    {
      title: `Welcome to the ${community.name}`,
      author: 'devverse-core',
      timeAgo: 'Just now',
      body: 'Connect with fellow developers in this guild. Share code snippets, discuss technical tradeoffs, and build teams.',
      replies: 0,
    },
  ];

  return (
    <div style={{ maxWidth: '900px', margin: '24px auto', padding: '0 24px 90px' }}>
      {/* Navigation Breadcrumb */}
      <div style={{ marginBottom: '20px' }}>
        <Link
          to="/communities"
          style={{
            fontSize: '13px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-tertiary)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          ← Back to Communities
        </Link>
      </div>

      {actionNotice && (
        <div style={{ marginBottom: '20px' }}>
          <StatusMessage
            type={actionNotice.type}
            message={actionNotice.message}
            onDismiss={() => setActionNotice(null)}
          />
        </div>
      )}

      {/* Hero Header Card */}
      <div
        className="glass"
        style={{
          padding: '28px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '24px',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderRadius: '20px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: gradientBg,
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              flexShrink: 0,
            }}
          />
          <div>
            <h1 style={{ fontSize: '26px', marginBottom: '6px', fontWeight: 700 }}>
              {community.name}
            </h1>
            <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', maxWidth: '520px', lineHeight: 1.5 }}>
              {community.description}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <span className="chip" style={{ fontSize: '12px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>{community.onlineCount}</span> online
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-tertiary)' }}>
            {(community.membersCount || 0).toLocaleString()} members
          </span>
          <button
            type="button"
            className={`btn ${community.isMember ? 'btn-ghost' : 'btn-primary'}`}
            onClick={handleToggleJoin}
            disabled={actionLoading}
            aria-label={community.isMember ? `Leave ${community.name}` : `Join ${community.name}`}
          >
            {community.isMember ? 'Joined' : 'Join'}
          </button>
        </div>
      </div>

      {/* Membership Info Box */}
      <div
        className="glass"
        style={{
          padding: '16px 20px',
          borderRadius: '14px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderLeft: community.isMember ? '3px solid var(--accent)' : '3px solid var(--border)',
        }}
      >
        <span style={{ fontSize: '18px' }}>{community.isMember ? '🛡️' : '🔒'}</span>
        <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {community.isMember
            ? `You are an active member of ${community.name}. You have access to guild discussions and member-only squad matching.`
            : `Join ${community.name} to participate in guild discussions, start technical threads, and connect with fellow builders.`}
        </div>
      </div>

      {/* Discussion Threads Preview */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div className="eyebrow">Guild Board</div>
            <h2 style={{ fontSize: '22px' }}>Discussions</h2>
          </div>
          <span
            className="chip chip-accent"
            style={{ fontSize: '11px', textTransform: 'uppercase' }}
          >
            Threads & Replies in Prompt 26
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {previews.map((thread, idx) => (
            <div
              key={idx}
              className="glass"
              style={{
                padding: '20px',
                borderRadius: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{thread.title}</h3>
                <span className="chip" style={{ fontSize: '11px' }}>
                  {thread.replies} repl{thread.replies === 1 ? 'y' : 'ies'}
                </span>
              </div>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {thread.body}
              </p>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                By @{thread.author} · {thread.timeAgo}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
