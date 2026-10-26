/**
 * DEVVERSE — Community Detail & Forum Page
 *
 * Grounded in Phase 1 community.html and js/pages/community.js.
 * Prompt 26 upgrade: replaces static seed previews with live MongoDB-backed threads.
 *
 * Displays:
 *   - Community banner with gradient badge, guild title, description
 *   - Live member and online metrics
 *   - Authenticated Join/Leave toggle with optimistic update & rollback
 *   - Guild membership status indicator
 *   - Live thread list from /api/communities/:id/threads
 *   - Thread detail panel (click to expand) with reply list
 *   - Authenticated compose forms for threads and replies
 *   - XSS safety: all user content rendered as React text children (no dangerouslySetInnerHTML)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import communityService from '../services/communityService';
import threadService from '../services/threadService';
import { useAuth } from '../context/AuthContext';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import StatusMessage from '../components/ui/StatusMessage';
import Button from '../components/ui/Button';

const TECH_GRADIENTS = [
  'linear-gradient(135deg, #7c6fff, #4fe3c1)',
  'linear-gradient(135deg, #ff6b5b, #7c6fff)',
  'linear-gradient(135deg, #4fe3c1, #ffb86b)',
  'linear-gradient(135deg, #ffb86b, #ff6b5b)',
  'linear-gradient(135deg, #7c6fff, #ff6b5b)',
];

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ── Compose Thread Form ─────────────────────────────────────────────────────────
function ComposeThreadForm({ communityId, onCreated }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);

  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = 'Title is required.';
    else if (title.trim().length < 5) e.title = 'Title must be at least 5 characters.';
    else if (title.trim().length > 140) e.title = 'Title cannot exceed 140 characters.';
    if (!body.trim()) e.body = 'Body is required.';
    else if (body.trim().length < 10) e.body = 'Body must be at least 10 characters.';
    else if (body.trim().length > 5000) e.body = 'Body cannot exceed 5000 characters.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    try {
      const thread = await threadService.createThread(communityId, { title, body });
      setTitle('');
      setBody('');
      onCreated(thread);
    } catch (err) {
      setServerError(err.message || 'Failed to post thread. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {serverError && (
        <StatusMessage type="error" message={serverError} onDismiss={() => setServerError(null)} />
      )}
      <div>
        <input
          type="text"
          className="input"
          placeholder="Thread title (5–140 characters)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={140}
          disabled={submitting}
          style={{ width: '100%' }}
          aria-label="Thread title"
        />
        {errors.title && (
          <div style={{ color: 'var(--coral, #ff6b5b)', fontSize: '12px', marginTop: '4px' }}>{errors.title}</div>
        )}
      </div>
      <div>
        <textarea
          className="input"
          placeholder="What do you want to discuss? (10–5000 characters)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={5000}
          disabled={submitting}
          style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
          aria-label="Thread body"
        />
        {errors.body && (
          <div style={{ color: 'var(--coral, #ff6b5b)', fontSize: '12px', marginTop: '4px' }}>{errors.body}</div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="submit" variant="primary" size="sm" disabled={submitting}>
          {submitting ? 'Posting…' : 'Post Thread'}
        </Button>
      </div>
    </form>
  );
}

// ── Compose Reply Form ──────────────────────────────────────────────────────────
function ComposeReplyForm({ communityId, threadId, onCreated }) {
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!body.trim()) { setError('Reply body is required.'); return; }
    if (body.trim().length > 2000) { setError('Reply cannot exceed 2000 characters.'); return; }
    setSubmitting(true);
    try {
      const reply = await threadService.createReply(communityId, threadId, { body });
      setBody('');
      onCreated(reply);
    } catch (err) {
      setError(err.message || 'Failed to post reply. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginTop: '12px' }}>
      <textarea
        className="input"
        placeholder="Write a reply… (max 2000 characters)"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
        maxLength={2000}
        disabled={submitting}
        style={{ flex: 1, resize: 'vertical', fontFamily: 'inherit' }}
        aria-label="Reply body"
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
        <Button type="submit" variant="primary" size="sm" disabled={submitting}>
          {submitting ? '…' : 'Reply'}
        </Button>
        {error && (
          <div style={{ color: 'var(--coral, #ff6b5b)', fontSize: '11px', maxWidth: '180px', textAlign: 'right' }}>{error}</div>
        )}
      </div>
    </form>
  );
}

// ── Thread Card (expandable) ────────────────────────────────────────────────────
function ThreadCard({ thread, communityId, user, isOpen, onToggle }) {
  const [replies, setReplies] = useState([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [repliesError, setRepliesError] = useState(null);
  const [localRepliesCount, setLocalRepliesCount] = useState(thread.repliesCount || 0);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    setRepliesLoading(true);
    setRepliesError(null);
    threadService.getReplies(communityId, thread._id)
      .then((data) => { if (mounted) setReplies(data); })
      .catch((err) => { if (mounted) setRepliesError(err.message || 'Failed to load replies.'); })
      .finally(() => { if (mounted) setRepliesLoading(false); });
    return () => { mounted = false; };
  }, [isOpen, communityId, thread._id]);

  const handleReplyCreated = (reply) => {
    setReplies((prev) => [...prev, reply]);
    setLocalRepliesCount((c) => c + 1);
  };

  const authorName = thread.author?.displayName || thread.author?.username || 'Anonymous';

  return (
    <div
      className="glass"
      style={{
        borderRadius: '14px',
        overflow: 'hidden',
        borderLeft: isOpen ? '3px solid var(--accent)' : '3px solid transparent',
      }}
    >
      {/* Thread header — always visible, click to expand/collapse */}
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '18px 20px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '12px',
        }}
        aria-expanded={isOpen}
      >
        <div style={{ flex: 1 }}>
          {/* Title — rendered as text node: safe from XSS */}
          <div style={{ fontSize: '15.5px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
            {thread.title}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
            By @{authorName} · {timeAgo(thread.createdAt)}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <span className="chip" style={{ fontSize: '11px' }}>
            {localRepliesCount} repl{localRepliesCount === 1 ? 'y' : 'ies'}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{isOpen ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Expanded panel */}
      {isOpen && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)' }}>
          {/* Thread body — plain text, safe from XSS */}
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.65, margin: '16px 0' }}>
            {thread.body}
          </p>

          {/* Replies */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: '10px' }}>
              {localRepliesCount} {localRepliesCount === 1 ? 'reply' : 'replies'}
            </div>

            {repliesLoading && <LoadingState message="Loading replies…" />}
            {repliesError && <StatusMessage type="error" message={repliesError} />}

            {!repliesLoading && !repliesError && replies.length === 0 && (
              <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                No replies yet. Be the first to respond.
              </div>
            )}

            {!repliesLoading && replies.map((reply) => (
              <div
                key={reply._id}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'var(--surface-secondary, rgba(255,255,255,0.03))',
                  marginBottom: '8px',
                  borderLeft: '2px solid var(--border)',
                }}
              >
                {/* Reply body — plain text, safe from XSS */}
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {reply.body}
                </p>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: '6px' }}>
                  @{reply.author?.displayName || reply.author?.username || 'Anonymous'} · {timeAgo(reply.createdAt)}
                </div>
              </div>
            ))}

            {/* Reply compose */}
            {user ? (
              <ComposeReplyForm
                communityId={communityId}
                threadId={thread._id}
                onCreated={handleReplyCreated}
              />
            ) : (
              <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '12px' }}>
                <Link to="/login" style={{ color: 'var(--accent)' }}>Sign in</Link> to post a reply.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────────
export default function CommunityDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [threadsError, setThreadsError] = useState(null);
  const [openThreadId, setOpenThreadId] = useState(null);
  const [showComposeThread, setShowComposeThread] = useState(false);

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
        if (isMounted) setError(err.message || `Unable to load community "${id}".`);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadCommunity();
    return () => { isMounted = false; };
  }, [id, user]);

  const loadThreads = useCallback(async (communityId) => {
    setThreadsLoading(true);
    setThreadsError(null);
    try {
      const data = await threadService.getThreads(communityId);
      setThreads(data);
    } catch (err) {
      setThreadsError(err.message || 'Failed to load threads.');
    } finally {
      setThreadsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!community) return;
    loadThreads(community.slug || community._id || community.id);
  }, [community, loadThreads]);

  const handleToggleJoin = async () => {
    if (!user) {
      setActionNotice({ type: 'warning', message: 'Please sign in to join communities.' });
      return;
    }
    if (!community || actionLoading) return;
    setActionLoading(true);
    setActionNotice(null);
    const isMember = community.isMember;
    const slug = community.slug || community.id;
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
      setCommunity((prev) => ({
        ...prev,
        isMember: isMember,
        membersCount: Math.max(0, (prev.membersCount || 0) + (isMember ? 1 : -1)),
      }));
      setActionNotice({ type: 'error', message: err.message || 'Unable to update membership.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleThreadCreated = (thread) => {
    setThreads((prev) => [thread, ...prev]);
    setShowComposeThread(false);
    setOpenThreadId(thread._id);
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

  const gradientBg = TECH_GRADIENTS[(community.gradient || 0) % TECH_GRADIENTS.length];
  const communityIdOrSlug = community.slug || community._id || community.id;

  return (
    <div style={{ maxWidth: '900px', margin: '24px auto', padding: '0 24px 90px' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '20px' }}>
        <Link
          to="/communities"
          style={{
            fontSize: '13px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-tertiary)',
            textDecoration: 'none',
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

      {/* Membership info box */}
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

      {/* Thread Board */}
      <section>
        {/* Section header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div className="eyebrow">Guild Board</div>
            <h2 style={{ fontSize: '22px' }}>Discussions</h2>
          </div>
          {user ? (
            <Button
              type="button"
              variant={showComposeThread ? 'ghost' : 'primary'}
              size="sm"
              onClick={() => setShowComposeThread((v) => !v)}
            >
              {showComposeThread ? 'Cancel' : '+ New Thread'}
            </Button>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
              <Link to="/login" style={{ color: 'var(--accent)' }}>Sign in</Link> to start a thread.
            </div>
          )}
        </div>

        {/* Compose thread form */}
        {showComposeThread && user && (
          <div className="glass" style={{ padding: '20px', borderRadius: '14px', marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '14px' }}>New Thread</div>
            <ComposeThreadForm communityId={communityIdOrSlug} onCreated={handleThreadCreated} />
          </div>
        )}

        {/* Thread list */}
        {threadsLoading && <LoadingState skeleton count={3} label="Loading discussions…" />}

        {threadsError && (
          <StatusMessage type="error" message={threadsError}>
            <div style={{ marginTop: '12px' }}>
              <Button type="button" variant="primary" size="sm" onClick={() => loadThreads(communityIdOrSlug)}>
                Retry
              </Button>
            </div>
          </StatusMessage>
        )}

        {!threadsLoading && !threadsError && threads.length === 0 && (
          <div className="glass" style={{ padding: '32px', borderRadius: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>💬</div>
            <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>No threads yet</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {user ? 'Be the first to start a discussion in this guild.' : 'Sign in to start the first discussion.'}
            </div>
          </div>
        )}

        {!threadsLoading && !threadsError && threads.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {threads.map((thread) => (
              <ThreadCard
                key={thread._id}
                thread={thread}
                communityId={communityIdOrSlug}
                user={user}
                isOpen={openThreadId === thread._id}
                onToggle={() => setOpenThreadId((prev) => (prev === thread._id ? null : thread._id))}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
