import React from 'react';

export default function Logo({ size = 48 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background circle */}
      <circle cx="100" cy="100" r="95" fill="#F0F9FF" stroke="#0EA5E9" strokeWidth="2" />

      {/* Shopping cart base */}
      <g>
        {/* Cart handle */}
        <path
          d="M 60 50 Q 100 30 140 50"
          stroke="#0EA5E9"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />

        {/* Cart body */}
        <path
          d="M 65 65 L 70 120 Q 70 130 80 130 L 140 130 Q 150 130 150 120 L 155 65 Z"
          fill="#E0F2FE"
          stroke="#0EA5E9"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Cart wheels */}
        <circle cx="85" cy="135" r="5" fill="#0EA5E9" />
        <circle cx="125" cy="135" r="5" fill="#0EA5E9" />
      </g>

      {/* Price chart inside cart */}
      <g>
        {/* Dollar sign bars (like a chart) */}
        <rect x="85" y="90" width="8" height="25" fill="#10B981" rx="2" />
        <rect x="100" y="80" width="8" height="35" fill="#3B82F6" rx="2" />
        <rect x="115" y="85" width="8" height="30" fill="#F59E0B" rx="2" />

        {/* Dollar sign symbol overlay */}
        <text
          x="100"
          y="110"
          fontSize="28"
          fontWeight="bold"
          fill="#0EA5E9"
          textAnchor="middle"
          opacity="0.3"
        >
          $
        </text>
      </g>

      {/* Discount badge */}
      <circle cx="155" cy="70" r="18" fill="#EF4444" />
      <text x="155" y="78" fontSize="16" fontWeight="bold" fill="white" textAnchor="middle">
        %
      </text>

      {/* Sparkle effect */}
      <g fill="#10B981">
        <circle cx="145" cy="55" r="2" />
        <circle cx="165" cy="65" r="2" />
        <circle cx="55" cy="95" r="2" />
      </g>
    </svg>
  );
}
