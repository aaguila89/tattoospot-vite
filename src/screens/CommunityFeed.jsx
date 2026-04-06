import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import {
  collection, onSnapshot, query, orderBy,
  doc, updateDoc, arrayUnion, arrayRemove,
} from 'firebase/firestore';

export default function CommunityFeed({ setScreen, ClientTabBar }) {
  const [posts, setPosts] = useState([]);
  const [selectedStyle, setSelectedStyle] = useState('All');
  const [commentText, setCommentText] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [likeAnimation, setLikeAnimation] = useState({});
  const [loading, setLoading] = useState(true);
  const lastTap = useRef({});

  const user = auth.currentUser;
  const styles = ['All', 'Japanese', 'Blackwork', 'Realism', 'Fine Line', 'Watercolor', 'Traditional'];

  useEffect(() => {
    const q = query(collection(db, 'communityPosts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, snapshot => {
      setPosts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredPosts = selectedStyle === 'All'
    ? posts
    : posts.filter(p => p.style === selectedStyle);

  // Calculate trending styles
  const trendingStyles = ['Blackwork', 'Japanese', 'Fine Line'].map(style => {
    const count = posts
      .filter(p => p.style === style)
      .reduce((sum, p) => sum + (p.likes?.length || 0), 0);
    return { style, count };
  }).sort((a, b) => b.count - a.count);

  function getTimeAgo(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  async function handleLike(post) {
    if (!user) return;
    const postRef = doc(db, 'communityPosts', post.id);
    const liked = post.likes?.includes(user.uid);
    await updateDoc(postRef, {
      likes: liked ? arrayRemove(user.uid) : arrayUnion(user.uid),
    });
  }

  function handleDoubleTap(post) {
    const now = Date.now();
    const last = lastTap.current[post.id] || 0;
    if (now - last < 300) {
      // Double tap detected
      if (!post.likes?.includes(user?.uid)) {
        handleLike(post);
      }
      setLikeAnimation(prev => ({ ...prev, [post.id]: true }));
      setTimeout(() => setLikeAnimation(prev => ({ ...prev, [post.id]: false })), 1000);
    }
    lastTap.current[post.id] = now;
  }

  async function handleSave(post) {
    if (!user) return;
    const postRef = doc(db, 'communityPosts', post.id);
    const saved = post.saves?.includes(user.uid);
    await updateDoc(postRef, {
      saves: saved ? arrayRemove(user.uid) : arrayUnion(user.uid),
    });
  }

  async function handleShare(post) {
    const text = `Check out this tattoo by ${post.artistName} on TattooSpot! https://tattoospot.net`;
    if (navigator.share) {
      await navigator.share({ title: 'TattooSpot', text });
    } else {
      navigator.clipboard.writeText(text);
      alert('Link copied!');
    }
  }

  async function handleComment(post) {
    if (!user || !commentText[post.id]?.trim()) return;
    const postRef = doc(db, 'communityPosts', post.id);
    const newComment = {
      userId: user.uid,
      userName: user.displayName || 'User',
      text: commentText[post.id].trim(),
      createdAt: new Date().toISOString(),
    };
    await updateDoc(postRef, { comments: arrayUnion(newComment) });
    setCommentText(prev => ({ ...prev, [post.id]: '' }));
  }

  function toggleComments(postId) {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  }

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', paddingBottom: '80px' }}>

      {/* Header */}
      <div style={{
        padding: '16px 20px', background: '#0a0a0a',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ fontSize: '20px', fontWeight: '800', color: 'white' }}>
          Tattoo<span style={{ color: '#c84b2f' }}>Spot</span>
        </div>
        <div style={{ fontSize: '13px', color: '#8a8580', fontStyle: 'italic' }}>Community</div>
      </div>

      {/* Trending section */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#111' }}>
        <div style={{ fontSize: '11px', color: '#d4a853', fontWeight: '700', letterSpacing: '1px', marginBottom: '8px' }}>
          🔥 TRENDING THIS WEEK
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { style: 'Blackwork', color: '#c84b2f', bg: '#1a0a00', border: 'rgba(200,75,47,0.3)' },
            { style: 'Japanese', color: '#d4a853', bg: '#1a1a00', border: 'rgba(212,168,83,0.3)' },
            { style: 'Fine Line', color: '#22c55e', bg: '#0a1a0a', border: 'rgba(34,197,94,0.3)' },
          ].map(({ style, color, bg, border }) => {
            const count = posts.filter(p => p.style === style).reduce((sum, p) => sum + (p.likes?.length || 0), 0);
            return (
              <div
                key={style}
                onClick={() => setSelectedStyle(style)}
                style={{
                  flex: 1, background: bg, border: `1px solid ${border}`,
                  borderRadius: '10px', padding: '8px 10px', textAlign: 'center', cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: '11px', color: 'white', fontWeight: '700' }}>{style}</div>
                <div style={{ fontSize: '10px', color, marginTop: '2px' }}>↑ {count || '—'} likes</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Style filters */}
      <div style={{
        display: 'flex', gap: '8px', padding: '12px 16px',
        overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {styles.map(style => (
          <button
            key={style}
            onClick={() => setSelectedStyle(style)}
            style={{
              padding: '5px 14px', borderRadius: '20px', border: 'none',
              background: selectedStyle === style ? '#c84b2f' : '#1a1a1a',
              color: selectedStyle === style ? 'white' : '#8a8580',
              fontSize: '12px', fontWeight: selectedStyle === style ? '700' : '400',
              cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0,
            }}
          >
            {style}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '48px', color: '#8a8580' }}>Loading feed...</div>
      )}

      {!loading && filteredPosts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: '#8a8580' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📸</div>
          <p>No posts yet. Artists will start sharing their work here soon!</p>
        </div>
      )}

      {/* Posts */}
      {filteredPosts.map(post => {
        const liked = post.likes?.includes(user?.uid);
        const saved = post.saves?.includes(user?.uid);
        const likeCount = post.likes?.length || 0;
        const commentCount = post.comments?.length || 0;
        const showComments = expandedComments[post.id];
        const showHeartAnim = likeAnimation[post.id];

        return (
          <div key={post.id} style={{ marginBottom: '2px' }}>

            {/* Artist header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'linear-gradient(135deg,#c84b2f,#d4a853)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', flexShrink: 0,
              }}>
                {post.artistAvatar || '🎨'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>{post.artistName}</div>
                <div style={{ fontSize: '11px', color: '#8a8580' }}>
                  {post.location} · <span style={{ color: '#c84b2f' }}>{post.style}</span> · {getTimeAgo(post.createdAt)}
                </div>
              </div>
            </div>

            {/* Photo with double tap */}
            <div
              style={{ position: 'relative', cursor: 'pointer' }}
              onClick={() => handleDoubleTap(post)}
            >
              {post.imageUrl ? (
                <img
                  src={post.imageUrl}
                  alt="tattoo"
                  style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div style={{
                  width: '100%', height: '280px',
                  background: 'linear-gradient(135deg,#1a0a00,#2d1500)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60px',
                }}>
                  🎨
                </div>
              )}

              {/* Double tap heart animation */}
              {showHeartAnim && (
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%,-50%)',
                  fontSize: '80px', animation: 'none', opacity: 0.9,
                }}>
                  ❤️
                </div>
              )}

              {/* Double tap hint */}
              <div style={{
                position: 'absolute', bottom: '10px', right: '10px',
                background: 'rgba(0,0,0,0.6)', borderRadius: '20px',
                padding: '4px 10px', fontSize: '10px', color: 'rgba(255,255,255,0.7)',
              }}>
                ❤️ Double tap to like
              </div>
            </div>

            {/* Actions */}
            <div style={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '10px' }}>
                <button
                  onClick={() => handleLike(post)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: 0 }}
                >
                  <span style={{ fontSize: '22px' }}>{liked ? '❤️' : '🤍'}</span>
                  <span style={{ color: liked ? '#c84b2f' : '#8a8580', fontSize: '14px', fontWeight: '600' }}>{likeCount}</span>
                </button>
                <button
                  onClick={() => toggleComments(post.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: 0 }}
                >
                  <span style={{ fontSize: '22px' }}>💬</span>
                  <span style={{ color: '#8a8580', fontSize: '14px' }}>{commentCount}</span>
                </button>
                <button
                  onClick={() => handleSave(post)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: 0 }}
                >
                  <span style={{ fontSize: '22px' }}>🔖</span>
                  <span style={{ color: saved ? '#d4a853' : '#8a8580', fontSize: '14px' }}>{saved ? 'Saved' : 'Save'}</span>
                </button>
                <button
                  onClick={() => handleShare(post)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: 0, marginLeft: 'auto' }}
                >
                  <span style={{ fontSize: '22px' }}>📤</span>
                  <span style={{ color: '#8a8580', fontSize: '14px' }}>Share</span>
                </button>
              </div>

              {/* Caption */}
              <div style={{ fontSize: '13px', color: '#f5f0e8', lineHeight: '1.5', marginBottom: '6px' }}>
                <span style={{ fontWeight: '700' }}>{post.artistName}</span> {post.caption}
              </div>

              {/* Tags */}
              {post.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {post.tags.map(tag => (
                    <span key={tag} style={{ fontSize: '11px', color: '#c84b2f' }}>#{tag}</span>
                  ))}
                </div>
              )}

              {/* Comments */}
              <div style={{ marginBottom: '10px' }}>
                {commentCount > 0 && (
                  <button
                    onClick={() => toggleComments(post.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#8a8580', padding: 0, marginBottom: '6px', fontFamily: 'inherit' }}
                  >
                    {showComments ? 'Hide comments' : `View all ${commentCount} comment${commentCount !== 1 ? 's' : ''}`}
                  </button>
                )}
                {showComments && post.comments?.map((c, i) => (
                  <div key={i} style={{ fontSize: '12px', color: '#f5f0e8', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '700' }}>{c.userName}</span> {c.text}
                  </div>
                ))}

                {/* Comment input */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: '#1a1a1a', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '14px', flexShrink: 0,
                  }}>👤</div>
                  <input
                    value={commentText[post.id] || ''}
                    onChange={e => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') handleComment(post); }}
                    placeholder="Add a comment..."
                    style={{
                      flex: 1, background: '#1a1a1a',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '20px', padding: '8px 14px',
                      fontSize: '12px', color: '#f5f0e8', outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                  {commentText[post.id]?.trim() && (
                    <button
                      onClick={() => handleComment(post)}
                      style={{
                        background: '#c84b2f', color: 'white', border: 'none',
                        borderRadius: '20px', padding: '6px 12px',
                        fontSize: '11px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      Post
                    </button>
                  )}
                </div>
              </div>

              {/* Book this artist banner */}
              <div style={{
                background: 'linear-gradient(135deg,#1a0a00,#2d1000)',
                border: '1px solid rgba(200,75,47,0.4)',
                borderRadius: '12px', padding: '12px 14px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ color: 'white', fontWeight: '700', fontSize: '13px', marginBottom: '2px' }}>
                    Inspired by this?
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
                    Book {post.artistName} for your next tattoo
                  </div>
                </div>
                <button
                  onClick={() => setScreen('discover')}
                  style={{
                    background: '#c84b2f', color: 'white', border: 'none',
                    borderRadius: '20px', padding: '8px 14px',
                    fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                    fontFamily: 'inherit', whiteSpace: 'nowrap',
                  }}
                >
                  Book Now →
                </button>
              </div>
            </div>

            <div style={{ height: '8px', background: '#111' }} />
          </div>
        );
      })}

      {ClientTabBar && <ClientTabBar activeTab="feed" />}
    </div>
  );
}