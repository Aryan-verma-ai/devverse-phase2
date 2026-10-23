/**
 * DEVVERSE — Communities Directory Page
 *
 * Grounded in Phase 1 communities.html and js/pages/communities.js.
 * Displays:
 *   - 6 canonical technical guilds with gradient banners and online indicators
 *   - Canonical member counts grounded in MongoDB CommunityMembership records
 *   - Authenticated Join / Joined toggle action with optimistic updates & error rollback
 *   - Recent discussion previews linking to community forums
 *   - Real loading skeletons and graceful error handling
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import communityService from '../services/communityService';
import { useAuth } from '../context/AuthContext';
import LoadingState from '../components/ui/LoadingState';
import StatusMessage from '../components/ui/StatusMessage';
import Button from '../components/ui/Button';

const TECH_GRADIENTS = [
  'linear-gradient(135deg, #7c6fff, #4fe3c1)',
  'linear-gradient(135deg, #ff6b5b, #7c6fff)',
  'linear-gradient(135deg, #4fe3c1, #ffb86b)',
  'linear-gradient(135deg, #ffb86b, #ff6b5b)',
  'linear-gradient(135deg, #7c6fff, #ff6b5b)',
];

const RECENT_DISCUSSIONS = [
  {
    title: 'Why we moved off REST for internal services',
    communityName: 'Rustaceans Guild',
    communitySlug: 'c1',
    timeAgo: '1h ago',
    repliesCount: 2,
  },
  {
    title: 'Best practices for component libraries in 2026',
    communityName: 'Frontend Atelier',
    communitySlug: 'c2',
    timeAgo: '3h ago',
    repliesCount: 1,
  },
  {
    title: 'Consensus algorithms worth learning this year',
    communityName: 'Distributed Systems Lab',
    communitySlug: 'c3',
    timeAgo: '4h ago',
    repliesCount: 3,
  },
  {
    title: 'Self-hosting open weights vs managed inference APIs',
    communityName: 'ML Practitioners',
    communitySlug: 'c4',
    timeAgo: '6h ago',
    repliesCount: 4,
  },
];

export default function CommunitiesPage() {
  const { user } = useAuth();

  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);
  const [actionLoadingSlug, setActionLoadingSlug] = useState(null);

  const fetchCommunities = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await communityService.getCommunities();
      setCommunities(data);
    } catch (err) {
      setError(err.message || 'Failed to load communities from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, [user]);

  const handleToggleJoin = async (community) => {
    if (!user) {
      setActionNotice({
        type: 'warning',
        message: 'Please sign in to join communities.',
      });
      return;
    }

    const slug = community.slug || community.id;
    const isCurrentlyMember = community.isMember;
    setActionLoadingSlug(slug);
    setActionNotice(null);

    // Optimistic UI update
    setCommunities((prev) =>
      prev.map((c) => {
        if ((c.slug || c.id) === slug) {
          const delta = isCurrentlyMember ? -1 : 1;
          return {
            ...c,
            isMember: !isCurrentlyMember,
            membersCount: Math.max(0, (c.membersCount || 0) + delta),
          };
        }
        return c;
      })
    );

    try {
      if (isCurrentlyMember) {
        const res = await communityService.leaveCommunity(slug);
        if (typeof res?.membersCount === 'number') {
          setCommunities((prev) =>
            prev.map((c) =>
              (c.slug || c.id) === slug ? { ...c, isMember: false, membersCount: res.membersCount } : c
            )
          );
        }
      } else {
        const res = await communityService.joinCommunity(slug);
        if (typeof res?.membersCount === 'number') {
          setCommunities((prev) =>
            prev.map((c) =>
              (c.slug || c.id) === slug ? { ...c, isMember: true, membersCount: res.membersCount } : c
            )
          );
        }
      }
    } catch (err) {
      // Revert optimistic update
      setCommunities((prev) =>
        prev.map((c) => {
          if ((c.slug || c.id) === slug) {
            const delta = isCurrentlyMember ? 1 : -1;
            return {
              ...c,
              isMember: isCurrentlyMember,
              membersCount: Math.max(0, (c.membersCount || 0) + delta),
            };
          }
          return c;
        })
      );
      setActionNotice({
        type: 'error',
        message: err.message || 'Unable to update community membership.',
      });
    } finally {
      setActionLoadingSlug(null);
    }
  };

  const totalMembers = communities.reduce((sum, c) => sum + (c.membersCount || 0), 0);
  const totalOnline = communities.reduce((sum, c) => sum + (c.onlineCount || 0), 0);

  return (
    <div className="communities-page-wrap" style={{ paddingBottom: '90px' }}>
      {/* Page Header */}
      <section className="wrap page-header" style={{ padding: '40px 24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <div className="eyebrow">Find your people</div>
            <h1 style={{ fontSize: 'clamp(34px, 5vw, 54px)', marginBottom: '8px' }}>
              Communities
            </h1>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', maxWidth: '640px', lineHeight: 1.6 }}>
              Specialized developer guilds where engineers debate architecture, share battle-tested lessons, and ship side quests together.
            </p>
          </div>

          {!loading && !error && communities.length > 0 && (
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div className="glass" style={{ padding: '10px 18px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>
                  {communities.length}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Guilds</div>
              </div>
              <div className="glass" style={{ padding: '10px 18px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: 'var(--cyan, #06b6d4)' }}>
                  {totalMembers.toLocaleString()}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Members</div>
              </div>
              <div className="glass" style={{ padding: '10px 18px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: 'var(--coral, #ff6b5b)' }}>
                  {totalOnline.toLocaleString()}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Online</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Content Area */}
      <section className="wrap" style={{ padding: '0 24px' }}>
        {actionNotice && (
          <div style={{ marginBottom: '20px' }}>
            <StatusMessage
              type={actionNotice.type}
              message={actionNotice.message}
              onDismiss={() => setActionNotice(null)}
            />
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <LoadingState skeleton count={6} label="Loading developer communities from database..." />
        )}

        {/* Error State */}
        {!loading && error && (
          <div style={{ marginBottom: '32px' }}>
            <StatusMessage type="error" title="Failed to Load Communities" message={error}>
              <div style={{ marginTop: '16px' }}>
                <Button type="button" variant="primary" size="sm" onClick={fetchCommunities}>
                  Retry Loading
                </Button>
              </div>
            </StatusMessage>
          </div>
        )}

        {/* Communities Grid */}
        {!loading && !error && communities.length > 0 && (
          <div className="grid grid-3" style={{ marginBottom: '48px' }}>
            {communities.map((c) => {
              const gradientBg = TECH_GRADIENTS[c.gradient % TECH_GRADIENTS.length] || TECH_GRADIENTS[0];
              const isWorking = actionLoadingSlug === (c.slug || c.id);

              return (
                <div
                  key={c.slug || c.id}
                  className="glass card-lift"
                  style={{
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    borderRadius: '16px',
                  }}
                >
                  {/* Top Bar: Gradient Icon and Online Counter */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '14px',
                        background: gradientBg,
                        boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
                      }}
                    />
                    <span className="chip" style={{ fontSize: '12px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>{c.onlineCount}</span> online
                    </span>
                  </div>

                  {/* Body: Title and Description */}
                  <Link
                    to={`/communities/${c.slug || c.id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <h3 style={{ fontSize: '19px', marginBottom: '8px', fontWeight: 700 }}>
                      {c.name}
                    </h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {c.description}
                    </p>
                  </Link>

                  {/* Tags */}
                  {c.tags && c.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {c.tags.map((t) => (
                        <span key={t} className="chip" style={{ fontSize: '11px' }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer: Member Count and Action Buttons */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '14px',
                      borderTop: '1px solid var(--border)',
                      marginTop: 'auto',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px', color: 'var(--text-tertiary)' }}>
                      {(c.membersCount || 0).toLocaleString()} members
                    </span>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <Link
                        to={`/communities/${c.slug || c.id}`}
                        className="btn btn-sm btn-outline"
                        style={{ textDecoration: 'none' }}
                      >
                        Open
                      </Link>
                      <button
                        type="button"
                        className={`btn btn-sm ${c.isMember ? 'btn-ghost' : 'btn-primary'}`}
                        onClick={() => handleToggleJoin(c)}
                        disabled={isWorking}
                        aria-label={c.isMember ? `Leave ${c.name}` : `Join ${c.name}`}
                      >
                        {c.isMember ? 'Joined' : 'Join'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Fresh Threads / Recent Discussions Preview */}
        <section style={{ marginTop: '20px' }}>
          <div style={{ marginBottom: '18px' }}>
            <div className="eyebrow">Fresh threads</div>
            <h2 style={{ fontSize: '24px' }}>Recent discussions</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {RECENT_DISCUSSIONS.map((t, idx) => (
              <Link
                key={idx}
                to={`/communities/${t.communitySlug}`}
                className="glass"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px',
                  textDecoration: 'none',
                  color: 'inherit',
                  borderRadius: '12px',
                  transition: 'border-color 0.2s',
                }}
              >
                <div>
                  <div style={{ fontSize: '14.5px', fontWeight: 600 }}>{t.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                    {t.communityName} · {t.timeAgo}
                  </div>
                </div>
                <span className="chip" style={{ fontSize: '12px' }}>
                  {t.repliesCount} repl{t.repliesCount === 1 ? 'y' : 'ies'}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}
