import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PlaceholderPage from './pages/PlaceholderPage';
import ExplorePage from './pages/ExplorePage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import SubmitProjectPage from './pages/SubmitProjectPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<AppShell />}>
            {/* 1. Home Dashboard */}
            <Route
              path="/"
              element={
                <PlaceholderPage
                  title="Where Builders Become Legends"
                  eyebrow="Home Dashboard"
                  tier="Tier 1 / Tier 4"
                  description="The unified space for developers — discover projects, showcase work, join hackathons, and climb the leaderboard."
                  quickLinks={[
                    { path: '/explore', label: 'Explore Projects' },
                    { path: '/hackathons', label: 'Hackathons' },
                    { path: '/portfolio', label: 'Build Portfolio' },
                  ]}
                />
              }
            />

            {/* 2. Explore Projects */}
            <Route path="/explore" element={<ExplorePage />} />

            {/* 3. Project Detail */}
            <Route path="/projects/:id" element={<ProjectDetailPage />} />

            {/* 4. Submit Project (Protected Action) */}
            <Route
              path="/submit-project"
              element={
                <ProtectedRoute>
                  <SubmitProjectPage />
                </ProtectedRoute>
              }
            />

          {/* 5. Communities Directory */}
          <Route
            path="/communities"
            element={
              <PlaceholderPage
                title="Communities Directory"
                eyebrow="Find Your People"
                tier="Tier 3"
                description="Connect with developers across specialized guilds: Rust, Frontend, ML, Systems, and Indie Hacking."
                quickLinks={[
                  { path: '/communities/c1', label: 'Rustaceans Guild Forum (c1)' },
                  { path: '/squads', label: 'Squad Matching' },
                ]}
              />
            }
          />

          {/* 6. Community Forum Detail */}
          <Route
            path="/communities/:id"
            element={
              <PlaceholderPage
                title="Community Forum"
                eyebrow="Discussions & Threads"
                tier="Tier 3"
                description="Engage in technical discussions, start question threads, and post architectural answers."
                quickLinks={[
                  { path: '/communities', label: 'All Communities' },
                ]}
              />
            }
          />

          {/* 7. Hackathons Directory */}
          <Route
            path="/hackathons"
            element={
              <PlaceholderPage
                title="Upcoming Hackathons"
                eyebrow="Compete & Win"
                tier="Tier 4"
                description="Global sprints, prize pools, and live countdown timers for developer tools and open-source hacks."
                quickLinks={[
                  { path: '/hackathons/h1', label: 'Aurora Hacks 2026 (h1)' },
                  { path: '/squads', label: 'Find a Squad' },
                ]}
              />
            }
          />

          {/* 8. Hackathon Detail */}
          <Route
            path="/hackathons/:id"
            element={
              <PlaceholderPage
                title="Hackathon Detail & Registration"
                eyebrow="Event Information"
                tier="Tier 4"
                description="Event rules, submission tracks, judging criteria breakdown, and registration management."
                quickLinks={[
                  { path: '/hackathons', label: 'All Hackathons' },
                  { path: '/squads', label: 'Squad Team Matcher' },
                ]}
              />
            }
          />

          {/* 9. Squads & Team Matching */}
          <Route
            path="/squads"
            element={
              <PlaceholderPage
                title="Squads & Team Matching"
                eyebrow="Collaborative Teaming"
                tier="Tier 3"
                description="Algorithm-driven skill compatibility matcher for hackathon teams and long-term project squads."
                quickLinks={[
                  { path: '/hackathons', label: 'Hackathons' },
                  { path: '/portfolio', label: 'Update Portfolio Skills' },
                ]}
              />
            }
          />

          {/* 10. Portfolio Builder & Viewer (Protected) */}
          <Route
            path="/portfolio"
            element={
              <ProtectedRoute>
                <PlaceholderPage
                  title="Portfolio Builder"
                  eyebrow="Builder Showcase"
                  tier="Tier 2"
                  description="Interactive portfolio editor with live card preview, skill chips, links, and public shareable URLs."
                  quickLinks={[
                    { path: '/profile', label: 'Your Profile' },
                    { path: '/settings', label: 'Settings' },
                  ]}
                />
              </ProtectedRoute>
            }
          />

          {/* 11. Developer Profile (Protected) */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <PlaceholderPage
                  title="Developer Profile"
                  eyebrow="Builder Identity"
                  tier="Tier 2"
                  description="Profile view, contribution heatmap, points progress, badge achievements, and personal library."
                  quickLinks={[
                    { path: '/portfolio', label: 'Edit Portfolio' },
                    { path: '/leaderboard', label: 'Check Leaderboard' },
                  ]}
                />
              </ProtectedRoute>
            }
          />

          {/* 12. Leaderboard */}
          <Route
            path="/leaderboard"
            element={
              <PlaceholderPage
                title="Community Leaderboard"
                eyebrow="Rankings & Status"
                tier="Tier 4"
                description="Weekly and all-time rankings for developers and projects, accompanied by a verified point transaction log."
                quickLinks={[
                  { path: '/profile', label: 'Your Profile' },
                  { path: '/codex', label: 'The Codex (200 pts)' },
                ]}
              />
            }
          />

          {/* 13. The Codex */}
          <Route
            path="/codex"
            element={
              <PlaceholderPage
                title="The Codex"
                eyebrow="Knowledge Base"
                tier="Tier 4"
                description="Archive of real debugging war stories and architecture lessons, gated behind 200 platform points."
                quickLinks={[
                  { path: '/leaderboard', label: 'Earn Points on Leaderboard' },
                ]}
              />
            }
          />

          {/* 14. Settings (Protected) */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <PlaceholderPage
                  title="Preferences & Settings"
                  eyebrow="Account Settings"
                  tier="Tier 2"
                  description="Theme toggles, motion preferences, accent colors (including Legend Tier gold), and account data management."
                  quickLinks={[
                    { path: '/profile', label: 'View Profile' },
                  ]}
                />
              </ProtectedRoute>
            }
          />

          {/* 15. Sign In */}
          <Route path="/login" element={<LoginPage />} />

          {/* 16. Sign Up */}
          <Route path="/signup" element={<SignupPage />} />

          {/* Backward-Compatible Redirects for Legacy .html URLs */}
          <Route path="/index.html" element={<Navigate to="/" replace />} />
          <Route path="/explore.html" element={<Navigate to="/explore" replace />} />
          <Route path="/project.html" element={<Navigate to="/explore" replace />} />
          <Route path="/submit-project.html" element={<Navigate to="/submit-project" replace />} />
          <Route path="/communities.html" element={<Navigate to="/communities" replace />} />
          <Route path="/community.html" element={<Navigate to="/communities" replace />} />
          <Route path="/hackathons.html" element={<Navigate to="/hackathons" replace />} />
          <Route path="/hackathon.html" element={<Navigate to="/hackathons" replace />} />
          <Route path="/squads.html" element={<Navigate to="/squads" replace />} />
          <Route path="/portfolio.html" element={<Navigate to="/portfolio" replace />} />
          <Route path="/profile.html" element={<Navigate to="/profile" replace />} />
          <Route path="/leaderboard.html" element={<Navigate to="/leaderboard" replace />} />
          <Route path="/codex.html" element={<Navigate to="/codex" replace />} />
          <Route path="/settings.html" element={<Navigate to="/settings" replace />} />
          <Route path="/login.html" element={<Navigate to="/login" replace />} />
          <Route path="/signup.html" element={<Navigate to="/signup" replace />} />

          {/* 404 Fallback */}
          <Route
            path="*"
            element={
              <PlaceholderPage
                title="404 — Page Not Found"
                eyebrow="Error"
                tier="AppShell"
                description="The destination you requested does not exist or has been relocated."
                quickLinks={[
                  { path: '/', label: 'Back to Home' },
                  { path: '/explore', label: 'Explore Projects' },
                ]}
              />
            }
          />
        </Route>
      </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
