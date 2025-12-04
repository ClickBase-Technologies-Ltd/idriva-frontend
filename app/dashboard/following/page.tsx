// app/following/page.tsx
'use client';

import FollowersPage from '../followers/page';

export default function FollowingPage() {
  // This will use the same component but default to 'following' type
  return <FollowersPage type="following" />;
}