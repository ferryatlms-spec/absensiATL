// packages/ui/src/components/Logo.jsx
import React from 'react';
import LogoSource from '../src/logoms.svg';

export const Logo = ({ className = "h-full w-full" }) => (
  <img 
    src={LogoSource} 
    alt="Mbok Surip Logo" 
    className={`object-contain ${className}`} 
  />
);