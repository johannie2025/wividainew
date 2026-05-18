/**
 * WividAI Built-in FrameScript Templates
 * Ready-to-use animated HTML templates
 */

const templates = new Map([

  ['promo-cinematic', {
    id: 'promo-cinematic',
    name: 'Cinematic Promo',
    description: 'Dark cinematic reveal with title and CTA',
    duration: 12,
    category: 'marketing',
    thumbnail: '/templates/promo-cinematic.jpg',
    variables: ['title', 'subtitle', 'cta', 'brand_color'],
    html: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  width: 1920px; height: 1080px;
  background: #000;
  font-family: 'Arial Black', sans-serif;
  overflow: hidden;
}
.bg {
  position: absolute; inset: 0;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #0a0a0a 100%);
}
.particles {
  position: absolute; inset: 0;
  background-image: radial-gradient(2px 2px at 20% 30%, rgba(255,255,255,0.3) 0%, transparent 100%),
    radial-gradient(2px 2px at 80% 10%, rgba(255,255,255,0.2) 0%, transparent 100%),
    radial-gradient(1px 1px at 60% 60%, rgba(255,255,255,0.15) 0%, transparent 100%);
}
.line {
  position: absolute; left: 0; top: 50%;
  width: 0; height: 3px;
  background: {{brand_color}};
  animation: line-expand 1s ease-out 0.5s forwards;
  box-shadow: 0 0 20px {{brand_color}};
}
@keyframes line-expand { to { width: 100%; } }

.content {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 30px;
}
.title {
  font-size: 120px; font-weight: 900;
  color: #fff; text-align: center;
  letter-spacing: -2px;
  opacity: 0; transform: translateY(80px);
  animation: slide-up 0.8s cubic-bezier(0.16,1,0.3,1) 1s forwards;
  text-shadow: 0 0 60px {{brand_color}};
}
.subtitle {
  font-size: 36px; color: rgba(255,255,255,0.7);
  letter-spacing: 8px; text-transform: uppercase;
  opacity: 0; transform: translateY(40px);
  animation: slide-up 0.8s cubic-bezier(0.16,1,0.3,1) 1.5s forwards;
}
.cta {
  margin-top: 40px;
  padding: 24px 80px;
  background: {{brand_color}};
  color: #000; font-size: 32px; font-weight: 800;
  letter-spacing: 4px; text-transform: uppercase;
  opacity: 0; transform: scale(0.8);
  animation: pop-in 0.5s cubic-bezier(0.34,1.56,0.64,1) 2.5s forwards;
}
@keyframes slide-up { to { opacity: 1; transform: translateY(0); } }
@keyframes pop-in { to { opacity: 1; transform: scale(1); } }

.vignette {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.8) 100%);
}
</style>
</head>
<body>
<div class="bg"></div>
<div class="particles"></div>
<div class="vignette"></div>
<div class="line"></div>
<div class="content">
  <div class="title">{{title}}</div>
  <div class="subtitle">{{subtitle}}</div>
  <div class="cta">{{cta}}</div>
</div>
</body>
</html>`
  }],

  ['social-story', {
    id: 'social-story',
    name: 'Social Story',
    description: 'Vertical 9:16 social media story format',
    duration: 6,
    category: 'social',
    thumbnail: '/templates/social-story.jpg',
    variables: ['headline', 'body', 'bg_color', 'accent'],
    html: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
* { margin:0;padding:0;box-sizing:border-box; }
body {
  width:1080px;height:1920px;
  background: {{bg_color}};
  font-family: 'Helvetica Neue', sans-serif;
  overflow:hidden;display:flex;align-items:center;justify-content:center;
}
.card {
  width:900px;padding:80px;
  background:rgba(255,255,255,0.1);
  border:2px solid rgba(255,255,255,0.3);
  border-radius:40px;text-align:center;
  backdrop-filter:blur(20px);
  opacity:0;transform:scale(0.9) translateY(60px);
  animation: card-in 0.8s cubic-bezier(0.16,1,0.3,1) 0.3s forwards;
}
h1 {
  font-size:90px;font-weight:900;color:#fff;
  line-height:1.1;margin-bottom:40px;
  text-shadow:0 4px 30px rgba(0,0,0,0.3);
}
p {
  font-size:40px;color:rgba(255,255,255,0.85);
  line-height:1.5;
}
.accent-bar {
  width:0;height:6px;background:{{accent}};
  border-radius:3px;margin:40px auto;
  animation:bar-grow 0.6s ease 1s forwards;
}
@keyframes card-in{to{opacity:1;transform:scale(1) translateY(0);}}
@keyframes bar-grow{to{width:200px;}}
</style>
</head>
<body>
<div class="card">
  <h1>{{headline}}</h1>
  <div class="accent-bar"></div>
  <p>{{body}}</p>
</div>
</body>
</html>`
  }],

  ['product-showcase', {
    id: 'product-showcase',
    name: 'Product Showcase',
    description: 'Product reveal with price and features',
    duration: 18,
    category: 'ecommerce',
    variables: ['product_name', 'price', 'feature1', 'feature2', 'feature3', 'bg_color'],
    html: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1920px;height:1080px;background:{{bg_color}};font-family:'Arial',sans-serif;overflow:hidden;}
.split{display:flex;height:100%;}
.left{flex:1;display:flex;flex-direction:column;justify-content:center;padding:120px;background:rgba(0,0,0,0.05);}
.right{flex:1;display:flex;flex-direction:column;justify-content:center;padding:100px;}
.product{font-size:90px;font-weight:900;color:#111;opacity:0;transform:translateX(-60px);animation:slide-r 0.9s ease 0.5s forwards;}
.price{font-size:120px;font-weight:900;color:#e74c3c;opacity:0;transform:translateX(-60px);animation:slide-r 0.9s ease 1s forwards;}
.feature{display:flex;align-items:center;gap:24px;margin:20px 0;opacity:0;transform:translateX(60px);}
.feature:nth-child(1){animation:slide-l 0.7s ease 1.5s forwards;}
.feature:nth-child(2){animation:slide-l 0.7s ease 1.8s forwards;}
.feature:nth-child(3){animation:slide-l 0.7s ease 2.1s forwards;}
.dot{width:20px;height:20px;background:#e74c3c;border-radius:50%;flex-shrink:0;}
.feature span{font-size:40px;color:#333;}
@keyframes slide-r{to{opacity:1;transform:translateX(0);}}
@keyframes slide-l{to{opacity:1;transform:translateX(0);}}
</style>
</head>
<body>
<div class="split">
  <div class="left">
    <div class="product">{{product_name}}</div>
    <div class="price">{{price}}</div>
  </div>
  <div class="right">
    <div class="feature"><div class="dot"></div><span>{{feature1}}</span></div>
    <div class="feature"><div class="dot"></div><span>{{feature2}}</span></div>
    <div class="feature"><div class="dot"></div><span>{{feature3}}</span></div>
  </div>
</div>
</body>
</html>`
  }],

  ['countdown-timer', {
    id: 'countdown-timer',
    name: 'Countdown Timer',
    description: 'Animated countdown with event info',
    duration: 30,
    category: 'event',
    variables: ['event_name', 'days', 'hours', 'minutes', 'bg_from', 'bg_to'],
    html: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1920px;height:1080px;background:linear-gradient(135deg,{{bg_from}},{{bg_to}});font-family:'Impact',sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:60px;overflow:hidden;}
h1{font-size:80px;color:rgba(255,255,255,0.9);letter-spacing:10px;text-transform:uppercase;opacity:0;animation:fade-in 1s ease 0.3s forwards;}
.timer{display:flex;gap:60px;}
.unit{text-align:center;background:rgba(255,255,255,0.15);backdrop-filter:blur(20px);padding:40px 60px;border-radius:20px;border:1px solid rgba(255,255,255,0.3);opacity:0;transform:translateY(40px);}
.unit:nth-child(1){animation:pop 0.6s ease 0.6s forwards;}
.unit:nth-child(2){animation:pop 0.6s ease 0.9s forwards;}
.unit:nth-child(3){animation:pop 0.6s ease 1.2s forwards;}
.num{font-size:160px;color:#fff;line-height:1;text-shadow:0 4px 30px rgba(0,0,0,0.3);}
.label{font-size:30px;color:rgba(255,255,255,0.7);letter-spacing:6px;margin-top:10px;}
@keyframes fade-in{to{opacity:1;}}
@keyframes pop{to{opacity:1;transform:translateY(0);}}
</style>
</head>
<body>
<h1>{{event_name}}</h1>
<div class="timer">
  <div class="unit"><div class="num">{{days}}</div><div class="label">DAYS</div></div>
  <div class="unit"><div class="num">{{hours}}</div><div class="label">HOURS</div></div>
  <div class="unit"><div class="num">{{minutes}}</div><div class="label">MINUTES</div></div>
</div>
</body>
</html>`
  }]
]);

module.exports = {
  get: (id) => templates.get(id),
  list: () => Array.from(templates.values()).map(t => ({
    id: t.id, name: t.name, description: t.description,
    duration: t.duration, category: t.category,
    thumbnail: t.thumbnail, variables: t.variables
  })),
  categories: () => [...new Set(Array.from(templates.values()).map(t => t.category))]
};
