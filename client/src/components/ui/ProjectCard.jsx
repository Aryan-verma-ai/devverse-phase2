import React from 'react';
import { Link } from 'react-router-dom';

const TECH_GRADIENTS = [
  'linear-gradient(135deg, #7c6fff, #4fe3c1)',
  'linear-gradient(135deg, #ff6b5b, #7c6fff)',
  'linear-gradient(135deg, #4fe3c1, #ffb86b)',
  'linear-gradient(135deg, #ffb86b, #ff6b5b)',
  'linear-gradient(135deg, #7c6fff, #ff6b5b)',
];

/**
 * Pure ProjectCard component.
 * Receives all data and interaction handlers via explicit props.
 * DOES NOT fetch global store or network data.
 *
 * @param {Object} props
 * @param {string} props.id - Project identifier
 * @param {string} props.title - Project title
 * @param {string} props.desc - Brief description
 * @param {string[]} [props.tags=[]] - Technology badges
 * @param {string} [props.difficulty='All'] - Difficulty rating
 * @param {number} [props.likes=0] - Total like count
 * @param {number|string} [props.views=0] - Total view count
 * @param {string} [props.art] - Banner image filename or URL
 * @param {number|string} [props.gradient=0] - Gradient index or CSS string
 * @param {boolean} [props.liked=false] - Whether current user liked this project
 * @param {boolean} [props.bookmarked=false] - Whether current user bookmarked this project
 * @param {function} [props.onLike] - Callback when like button is clicked: (event, id) => void
 * @param {function} [props.onBookmark] - Callback when bookmark button is clicked: (event, id) => void
 * @param {string} [props.to] - Target route (defaults to /projects/:id)
 * @param {string} [props.className='']
 */
export default function ProjectCard({
  id,
  title,
  desc,
  tags = [],
  difficulty = 'Beginner',
  likes = 0,
  views = 0,
  art,
  gradient = 0,
  liked = false,
  bookmarked = false,
  onLike,
  onBookmark,
  to,
  className = '',
}) {
  const targetRoute = to || `/projects/${id}`;

  const backgroundGradient = typeof gradient === 'number'
    ? TECH_GRADIENTS[gradient % TECH_GRADIENTS.length]
    : gradient || TECH_GRADIENTS[0];

  const formattedViews = typeof views === 'number'
    ? views >= 1000 ? `${(views / 1000).toFixed(views >= 10000 ? 0 : 1)}k` : views
    : views;

  const handleLikeClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onLike) onLike(e, id);
  };

  const handleBookmarkClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onBookmark) onBookmark(e, id);
  };

  return (
    <Link to={targetRoute} className={`project-card glass card-lift ${className}`.trim()}>
      <div className="pc-thumb" style={{ background: backgroundGradient }}>
        {art && (
          <img
            className="pc-art"
            src={art.startsWith('http') || art.startsWith('/') ? art : `/assets/img/project-cards/${art}`}
            alt=""
            aria-hidden="true"
            loading="lazy"
          />
        )}
        <span className="chip pc-diff">{difficulty}</span>
      </div>

      <div>
        <h3 className="pc-title">{title}</h3>
        <p className="pc-desc">{desc}</p>
      </div>

      {tags && tags.length > 0 && (
        <div className="pc-tags">
          {tags.map((tag) => (
            <span key={tag} className="chip">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="pc-stats">
        <button
          type="button"
          className={`pc-stat ${liked ? 'liked' : ''}`}
          onClick={handleLikeClick}
          aria-label={`Like ${title}, ${likes} likes`}
          title={liked ? 'Unlike project' : 'Like project'}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <span>{likes.toLocaleString()}</span>
        </button>

        <span className="pc-stat" title={`${views} views`}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span>{formattedViews}</span>
        </span>

        <button
          type="button"
          className={`pc-stat ${bookmarked ? 'bookmarked' : ''}`}
          onClick={handleBookmarkClick}
          style={{ marginLeft: 'auto' }}
          aria-label={`Bookmark ${title}`}
          title={bookmarked ? 'Remove bookmark' : 'Bookmark project'}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </div>
    </Link>
  );
}
