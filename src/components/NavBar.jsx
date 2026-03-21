import React from 'react';

function NavBar({ leftButton, rightButton }) {
  return (
    <div className="nav">
      <div style={{ width: '60px' }}>
        {leftButton}
      </div>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)'
      }}>
        <div className="nav-logo">Tattoo<span>Spot</span></div>
        <div style={{
          fontSize: '9px',
          fontWeight: '700',
          color: '#8a8580',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          marginTop: '1px',
        }}>
          Where Ink Meets Skin
        </div>
      </div>
      <div style={{ width: '60px', display: 'flex', justifyContent: 'flex-end' }}>
        {rightButton}
      </div>
    </div>
  );
}

export default NavBar;