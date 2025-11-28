// Static Morpheus Logo Component
export default function MorpheusLogo({ width = '45px', height = '45px', className }) {
  return (
    <div style={{ 
      width, 
      height, 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center' 
    }}>
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }} className={className}>
        {/* Define gradient */}
        <defs>
          <linearGradient id="tealGradientStatic" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:'#4dd0e1', stopOpacity:1}}/>
            <stop offset="50%" style={{stopColor:'#0ad4ef', stopOpacity:1}}/>
            <stop offset="100%" style={{stopColor:'#00bcd4', stopOpacity:1}}/>
          </linearGradient>
        </defs>
        
        {/* Main outer ring */}
        <circle cx="50" cy="50" r="43" fill="none" stroke="#1d2e3e" strokeWidth="9"/>
        
        {/* Inner ring with 1/4 gap at bottom - static position */}
        <path d="M 33.74 66.26 A 23 23 0 1 1 66.26 66.26" 
          fill="none" 
          stroke="url(#tealGradientStatic)" 
          strokeWidth="14"/>
        
        {/* Innermost circle */}
        <circle cx="50" cy="50" r="7.5" fill="url(#tealGradientStatic)" stroke="none"/>
        
        {/* Top small circle - static at top position */}
        <circle cx="50" cy="4" r="4" fill="#18e5eb" stroke="none"/>
        
        {/* Bottom small circle - static at bottom position */}
        <circle cx="50" cy="96" r="4" fill="#18e5eb" stroke="none"/>
      </svg>
    </div>
  );
}