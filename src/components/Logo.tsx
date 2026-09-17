import React from 'react';
import { Link } from 'react-router-dom';

export const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <Link to="/" className={`inline-block hover:opacity-95 transition-opacity ${className}`} title="Trang chủ Comic Book Reading Orders">
      <div style={{
        backgroundColor: '#e42525',
        color: '#ffffff',
        padding: '8px 22px',
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid #000000',
        boxShadow: '3px 3px 0px #000000',
        borderRadius: '2px',
        cursor: 'pointer',
        userSelect: 'none'
      }}>
        <div style={{
          fontFamily: '"Impact", "Arial Black", sans-serif',
          fontSize: '20px',
          fontWeight: 900,
          letterSpacing: '1.5px',
          lineHeight: '1.05',
          color: '#febd11',
          textShadow: '2px 2px 0px #000000, -1px -1px 0px #000000, 1px -1px 0px #000000, -1px 1px 0px #000000',
          textTransform: 'uppercase'
        }}>
          COMIC BOOK
        </div>
        <div style={{
          fontFamily: '"Impact", "Arial Black", sans-serif',
          fontSize: '26px',
          fontWeight: 900,
          letterSpacing: '2px',
          lineHeight: '1.1',
          color: '#ffffff',
          textShadow: '2px 2px 0px #000000, -1px -1px 0px #000000, 1px -1px 0px #000000, -1px 1px 0px #000000',
          textTransform: 'uppercase'
        }}>
          READING ORDERS
        </div>
        <div style={{
          fontSize: '9.5px',
          fontWeight: 700,
          letterSpacing: '2.5px',
          color: '#ffffff',
          textTransform: 'uppercase',
          marginTop: '2px',
          opacity: 0.95
        }}>
          THỨ TỰ ĐỌC TRUYỆN TRANH
        </div>
      </div>
    </Link>
  );
};
