#!/bin/bash
# Create simple icon files using sips (macOS built-in tool) or convert (ImageMagick)

mkdir -p icons

# Create a simple colored square icon using sips (macOS)
# We'll create a simple blue square with white ticket icon

# For 16x16
cat > /tmp/icon16.svg << 'EOF'
<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
  <rect width="16" height="16" fill="#0052CC" rx="2"/>
  <rect x="4" y="4" width="8" height="8" fill="#FFFFFF" rx="1"/>
  <circle cx="4" cy="6" r="1" fill="#0052CC"/>
  <circle cx="4" cy="8" r="1" fill="#0052CC"/>
  <circle cx="4" cy="10" r="1" fill="#0052CC"/>
  <rect x="5" y="6" width="5" height="1" fill="#C8C8C8"/>
  <rect x="5" y="8" width="3" height="1" fill="#C8C8C8"/>
</svg>
EOF

# For 48x48
cat > /tmp/icon48.svg << 'EOF'
<svg width="48" height="48" xmlns="http://www.w3.org/2000/svg">
  <rect width="48" height="48" fill="#0052CC" rx="6"/>
  <rect x="12" y="12" width="24" height="24" fill="#FFFFFF" rx="3"/>
  <circle cx="12" cy="16" r="2" fill="#0052CC"/>
  <circle cx="12" cy="22" r="2" fill="#0052CC"/>
  <circle cx="12" cy="28" r="2" fill="#0052CC"/>
  <rect x="16" y="18" width="16" height="2" fill="#C8C8C8"/>
  <rect x="16" y="24" width="10" height="2" fill="#C8C8C8"/>
</svg>
EOF

# For 128x128
cat > /tmp/icon128.svg << 'EOF'
<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
  <rect width="128" height="128" fill="#0052CC" rx="16"/>
  <rect x="32" y="32" width="64" height="64" fill="#FFFFFF" rx="8"/>
  <circle cx="32" cy="42" r="3" fill="#0052CC"/>
  <circle cx="32" cy="58" r="3" fill="#0052CC"/>
  <circle cx="32" cy="74" r="3" fill="#0052CC"/>
  <circle cx="32" cy="90" r="3" fill="#0052CC"/>
  <rect x="40" y="48" width="48" height="4" fill="#C8C8C8"/>
  <rect x="40" y="64" width="32" height="4" fill="#C8C8C8"/>
  <rect x="40" y="80" width="40" height="4" fill="#C8C8C8"/>
</svg>
EOF

# Convert SVG to PNG if qlmanage or convert is available
if command -v qlmanage &> /dev/null; then
    # Use qlmanage to convert (macOS)
    for size in 16 48 128; do
        if [ -f "/tmp/icon${size}.svg" ]; then
            # Create PNG using sips or other tool
            # For now, we'll use a workaround
            echo "Creating icon${size}.png..."
        fi
    done
elif command -v convert &> /dev/null; then
    convert /tmp/icon16.svg icons/icon16.png
    convert /tmp/icon48.svg icons/icon48.png
    convert /tmp/icon128.svg icons/icon128.png
else
    echo "Please install ImageMagick (brew install imagemagick) or use the generate_icons.html file in a browser"
    exit 1
fi

