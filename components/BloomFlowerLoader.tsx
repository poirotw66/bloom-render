/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * BloomRender loading animation: a flower slowly blooming (petals opening).
 * Used when AI is rendering/generating images.
 */

import React from 'react';

const PETAL_COUNT = 6;
const VIEWBOX = 48;
const CENTER = VIEWBOX / 2;

/** Single petal: ellipse from center. Rotation and bloom animation are in CSS (--r per nth-child). */
const Petal: React.FC = () => (
  <ellipse
    cx={CENTER}
    cy={CENTER}
    rx={6}
    ry={14}
    fill="currentColor"
    className="bloom-petal"
  />
);

interface BloomFlowerLoaderProps {
  className?: string;
  size?: number;
}

const BloomFlowerLoader: React.FC<BloomFlowerLoaderProps> = ({
  className = '',
  size = 80,
}) => {
  return (
    <div className={`bloom-flower-loader inline-flex items-center justify-center ${className}`}>
      <style>{`
        @keyframes bloom-open {
          0% {
            transform: rotate(var(--r)) scaleY(0.15);
            opacity: 0.4;
          }
          60% {
            transform: rotate(var(--r)) scaleY(1.02);
            opacity: 1;
          }
          100% {
            transform: rotate(var(--r)) scaleY(1);
            opacity: 1;
          }
        }
        .bloom-flower-loader .bloom-petal {
          --r: 0deg;
          transform-origin: 24px 24px;
          animation: bloom-open 2.4s ease-out infinite;
        }
        .bloom-flower-loader .bloom-petal:nth-child(1) { --r: 0deg;   animation-delay: 0ms;   }
        .bloom-flower-loader .bloom-petal:nth-child(2) { --r: 60deg;  animation-delay: 80ms;  }
        .bloom-flower-loader .bloom-petal:nth-child(3) { --r: 120deg; animation-delay: 160ms; }
        .bloom-flower-loader .bloom-petal:nth-child(4) { --r: 180deg; animation-delay: 240ms; }
        .bloom-flower-loader .bloom-petal:nth-child(5) { --r: 240deg; animation-delay: 320ms; }
        .bloom-flower-loader .bloom-petal:nth-child(6) { --r: 300deg; animation-delay: 400ms; }
        .bloom-flower-loader .bloom-center {
          animation: bloom-center 2.4s ease-out infinite;
        }
        @keyframes bloom-center {
          0% { transform: scale(0.3); opacity: 0.3; }
          50% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        className="text-blue-400/90"
        aria-hidden="true"
      >
        <g>
          {Array.from({ length: PETAL_COUNT }, (_, i) => (
            <Petal key={i} />
          ))}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={5}
            fill="currentColor"
            className="bloom-center origin-center opacity-90"
            style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
          />
        </g>
      </svg>
    </div>
  );
};

export default BloomFlowerLoader;
