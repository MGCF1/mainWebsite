# iOS Developer Portfolio

A minimal, Apple-inspired portfolio website with animated floating app icons.

## Features

- **Animated Icon Background**: 16 app icons float upward in 5 columns with parallax depth effect
- **Column-Based Density**: Outer columns (4 icons) move faster, center column (2 icons) moves slower
- **Slow Motion Hover**: All icons slow down when you hover over any icon
- **Responsive Design**: Works on desktop and mobile
- **Dark Mode Support**: Automatically adapts to system preferences
- **Apple Aesthetic**: Clean, minimal design with SF Pro font and smooth animations

## Structure

```
Website/
├── index.html              # Homepage with animated hero and project cards
├── css/
│   ├── styles.css         # Main styles and animations
│   └── project.css        # Project page styles
├── js/
│   └── app-grid.js        # Icon animation and distribution logic
├── projects/
│   └── project-*.html     # Individual project pages (10 templates)
├── images/                # (Create this) Place app icons and screenshots
└── videos/                # (Create this) Place demo videos
```

## Animation System

The floating icons use a sophisticated column-based system:

- **5 Columns**: 8%, 28%, 50%, 72%, 92%
- **Variable Density**: [4, 3, 2, 3, 4] icons per column
- **Size by Position**: Center (280px max) to Edges (120px min)
- **Speed by Size**: Smaller/faster (20-30s), Larger/slower (50-70s)
- **Seamless Looping**: Icons wrap from top to bottom with no gaps

## Customization Guide

### 1. Update Homepage (index.html)

- **Line 13**: Update your name in navigation
- **Line 29-31**: Update hero title, subtitle, and CTA text
- **Line 48**: Update about section content
- **Line 55-58**: Update contact links (email, GitHub, LinkedIn, Twitter)

### 2. Configure Projects (js/app-grid.js)

Edit the `projects` array (lines 2-83) with your actual projects:

```javascript
{
    id: 'your-project-id',
    name: 'Your App Name',
    icon: '🚀', // Use emoji or replace with image
    gradient: 'linear-gradient(135deg, #color1, #color2)',
    url: 'projects/your-project.html'
}
```

### 3. Customize Individual Project Pages

Each project page (projects/project-X.html) contains:

- **Hero Section**: App icon, name, tagline, and links
- **Features Section**: Key features with icons and descriptions
- **Screenshots Section**: App screenshots (replace SVG placeholders)
- **Video Section**: Demo video
- **Tech Stack Section**: Technologies used
- **CTA Section**: Call-to-action for downloads

To customize:
1. Update the project title and tagline
2. Replace gradient colors to match your app
3. Update feature icons and descriptions
4. Add real screenshots (replace the SVG placeholders)
5. Add demo video (uncomment video tag, add your video file)
6. Update tech stack tags
7. Update App Store and GitHub links

### 4. Adding Screenshots

Replace the SVG placeholders with actual images:

```html
<!-- Replace this: -->
<div class="screenshot-img">
    <svg>...</svg>
</div>

<!-- With this: -->
<div class="screenshot-img">
    <img src="../images/your-app-screenshot-1.png" alt="App Screenshot">
</div>
```

### 5. Adding Videos

1. Place your video file in the `videos/` folder
2. Uncomment the video tag in the project page:

```html
<video controls playsinline>
    <source src="../videos/your-app-demo.mp4" type="video/mp4">
</video>
```

### 6. Adding Real App Icons

Replace emoji icons with real images in `js/app-grid.js`:

```javascript
// Instead of icon: '📱'
// Use:
icon: '<img src="images/app-icon-1.png" alt="App Name" style="width: 100%; height: 100%; object-fit: cover;">'
```

## Design Features

- **Responsive**: Works on all screen sizes
- **Dark Mode**: Automatically adapts to system preferences
- **Smooth Animations**: 3D hover effects on app icons
- **Apple Aesthetic**: SF Pro font, clean spacing, minimal design
- **Fast Loading**: Pure HTML/CSS/JS, no frameworks

## Deployment

### Option 1: GitHub Pages
1. Push to GitHub
2. Go to Settings > Pages
3. Select branch and save

### Option 2: Netlify
1. Drag and drop the folder to Netlify
2. Done!

### Option 3: Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project directory
3. Follow prompts

## Color Customization

Update colors in `css/styles.css` (lines 9-17):

```css
:root {
    --background: #ffffff;
    --text-primary: #1d1d1f;
    --text-secondary: #86868b;
    --accent: #0071e3; /* Change this for your brand color */
    --card-background: #f5f5f7;
}
```

## Tips

1. **Keep it minimal**: Don't overcrowd pages with information
2. **High-quality assets**: Use crisp screenshots and smooth videos
3. **Consistent branding**: Use similar color schemes across projects
4. **Mobile-first**: Test on actual mobile devices
5. **Fast loading**: Optimize images and videos before uploading

## Browser Support

- Chrome/Edge (latest)
- Safari (latest)
- Firefox (latest)
- Mobile Safari (iOS 14+)
- Mobile Chrome

## License

Feel free to use this template for your own portfolio!
