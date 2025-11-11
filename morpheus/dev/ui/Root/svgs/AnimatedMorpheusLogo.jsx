// Animated Loading SVG Component
export default function AnimatedMorpheusLogo() {
  return (
    <div style={{ 
      width: '80x', 
      height: '80px', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center' 
    }}>
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        {/* Define gradient and filters */}
        <defs>
          <linearGradient id="tealGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:'#4dd0e1', stopOpacity:1}}/>
            <stop offset="50%" style={{stopColor:'#0ad4ef', stopOpacity:1}}/>
            <stop offset="100%" style={{stopColor:'#00bcd4', stopOpacity:1}}/>
          </linearGradient>
          
          {/* Animated filter for glow effect */}
          <filter id="animatedGlow">
            <feGaussianBlur stdDeviation="0" result="coloredBlur">
              <animate attributeName="stdDeviation" 
                values="0;3;0" 
                dur="2s" 
                repeatCount="indefinite"/>
            </feGaussianBlur>
            <feComponentTransfer in="coloredBlur">
              <feFuncA type="discrete" tableValues="0 .7 .8 .7 0">
                <animate attributeName="tableValues" 
                  values="0 0 0 0 0;0 .7 .8 .7 0;0 0 0 0 0" 
                  dur="2s" 
                  repeatCount="indefinite"/>
              </feFuncA>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Embedded CSS styles */}
        <style>{`
          @keyframes explodeDropShadow {
            0% {
              filter: brightness(0.9)
                drop-shadow(0 0 0 rgba(0, 255, 255, 0.7));
            }
            40% {
              filter: brightness(1.7)
                drop-shadow(0 0 5px rgba(0, 255, 255, 0.8))
                drop-shadow(0 0 10px rgba(0, 255, 255, 0.6));
            }
            100% {
              filter: brightness(0.9)
                drop-shadow(0 0 0 rgba(0, 255, 255, 0));
            }
          }
          
          .glowing-ring {
            animation: explodeDropShadow 2s ease-in-out infinite;
          }
        `}</style>
        
        {/* Main outer ring */}
        <circle cx="50" cy="50" r="43" fill="none" stroke="#1d2e3e" strokeWidth="9"/>
        
        {/* Inner ring with 1/4 gap at bottom (rotating clockwise with glow) */}
        <path d="M 33.74 66.26 A 23 23 0 1 1 66.26 66.26" 
          fill="none" 
          stroke="url(#tealGradient)" 
          strokeWidth="14"
          className="glowing-ring">
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="rotate"
            from="0 50 50"
            to="360 50 50"
            dur="9s"
            repeatCount="indefinite"/>
        </path>
        
        {/* Innermost circle */}
        <circle cx="50" cy="50" r="7.5" fill="url(#tealGradient)" className="glowing-ring" stroke="none"/>
        
        {/* Top small circle (starting at top, moving counter-clockwise) */}
        <circle cx="50" cy="4" r="4" fill="#18e5eb" stroke="none" className="glowing-ring">
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="rotate"
            from="0 50 50"
            to="-360 50 50"
            dur="3s"
            repeatCount="indefinite"/>
        </circle>
        
        {/* Bottom small circle (starting at bottom, moving counter-clockwise) */}
        <circle className="glowing-ring" cx="50" cy="96" r="4" fill="#18e5eb" stroke="none">
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="rotate"
            from="0 50 50"
            to="-360 50 50"
            dur="1s"
            repeatCount="indefinite"/>
        </circle>
      </svg>
    </div>
  );
}